import type { DB, Factura, FormaPago, OrigenFactura } from "@/lib/types";
import { fechaValida, IVA, ReglaBodegaError, totalesLineas } from "./engine-core";
import { asegurarDisponible } from "./engine-helpers";
import { coincidenItemsFactura, prepararLineas } from "./engine-lines";
import { validarCreditoClienteEngine } from "./engine-sales-validation";
import { aplicarDescargoFactura } from "./engine-sales-stock";
import { r2 } from "@/lib/format";

export function emitirFactura(
  db: DB,
  input: {
    cliente?: string;
    clienteNombre?: string;
    clienteId?: string | null;
    fecha?: string;
    notas?: string;
    creadoPor?: string;
    cotizacionId?: string | null;
    formaPago?: FormaPago;
    medioPago?: FormaPago;
    origen?: OrigenFactura;
    items?: Array<{ productoId: string; cantidad: number; precio?: number; observacion?: string; exentoIva?: boolean; descuento?: number }>;
    descuento?: number;
    exenta?: boolean;
    tasaIva?: number;
    montoRecibido?: number;
    claveIdempotencia?: string;
    claveOperacion?: string;
  },
) {
  const clienteFinal = (input.cliente ?? input.clienteNombre ?? "Consumidor Final").trim();
  const fechaDoc = input.fecha ?? new Date().toISOString().slice(0, 10);
  fechaValida(fechaDoc);
  const formaPagoFinal: FormaPago = input.formaPago ?? input.medioPago ?? "EFECTIVO";
  const claveIdem = input.claveIdempotencia ?? input.claveOperacion;
  const cotizacion = input.cotizacionId ? db.cotizaciones.find((c) => c.id === input.cotizacionId) ?? null : null;
  if (input.cotizacionId && !cotizacion) throw new ReglaBodegaError("La cotización no existe.");
  if (cotizacion && (cotizacion.estado === "FACTURADA" || cotizacion.facturaId)) {
    throw new ReglaBodegaError("Esa cotización ya fue facturada. El stock no se descuenta otra vez.");
  }
  const nombreCliente = cotizacion?.cliente || clienteFinal;
  if (nombreCliente.length < 2) throw new ReglaBodegaError("Indique el cliente.");

  const crudas = cotizacion
    ? cotizacion.items.map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precio: item.precio,
      observacion: item.observacion,
      exentoIva: item.exentoIva,
      descuento: item.descuento,
    }))
    : (input.items ?? []).map((it) => {
      const prod = db.productos.find((p) => p.id === it.productoId);
      return {
        productoId: it.productoId,
        cantidad: it.cantidad,
        precio: it.precio !== undefined ? it.precio : (prod?.precio ?? 0),
        observacion: it.observacion,
        exentoIva: it.exentoIva,
        descuento: it.descuento,
      };
    });

  const items = prepararLineas(db, crudas);
  const tasaImpuesto = input.exenta ? 0 : (input.tasaIva !== undefined ? input.tasaIva : IVA);
  const { subtotal, iva, isv, total } = totalesLineas(items, tasaImpuesto);
  const descuento = input.descuento ? r2(input.descuento) : 0;
  if (descuento < 0) throw new ReglaBodegaError("El descuento no puede ser negativo.");
  if (descuento > subtotal) throw new ReglaBodegaError("El descuento global no puede superar el subtotal de la venta.");
  const totalConDescuento = r2(Math.max(0, total - descuento));
  const costoTotalVenta = r2(items.reduce((s, it) => s + it.cantidad * (it.costoUnitario || 0), 0));
  const claveIdempotencia = claveIdem?.trim() || undefined;

  if (claveIdempotencia) {
    const existente = db.facturas.find((f) => f.claveIdempotencia === claveIdempotencia);
    if (existente) {
      const coincideCliente = existente.cliente.trim().toLowerCase() === nombreCliente.trim().toLowerCase();
      const coincideFormaPago = existente.formaPago === formaPagoFinal;
      const coincideTotal = Math.abs((existente.total ?? 0) - totalConDescuento) <= 0.01;
      const coincidenLineas = coincidenItemsFactura(existente.items, items);
      if (!coincideCliente || !coincideFormaPago || !coincideTotal || !coincidenLineas) {
        throw new ReglaBodegaError(
          "CLAVE_IDEMPOTENCIA_CONFLICTO: La clave de operación ya fue utilizada para otra venta con datos o importes diferentes."
        );
      }
      return existente;
    }
  }

  asegurarDisponible(db, items);

  if (formaPagoFinal === "CREDITO") {
    const clienteId = input.clienteId ?? cotizacion?.clienteId;
    if (!clienteId) throw new ReglaBodegaError("Para ventas al crédito es obligatorio seleccionar un cliente registrado.");
    validarCreditoClienteEngine(db, clienteId, totalConDescuento);
  }

  if (formaPagoFinal === "EFECTIVO" && input.origen === "CAJA") {
    const turno = (db.turnosCaja ?? []).find((t) => t.estado === "ABIERTO");
    if (!turno) {
      throw new ReglaBodegaError("No hay un turno de caja abierto para registrar el cobro en efectivo. Debe abrir caja primero.");
    }
  }

  const montoRecibido = input.montoRecibido !== undefined ? r2(input.montoRecibido) : undefined;
  let cambio: number | undefined = undefined;
  if (formaPagoFinal === "EFECTIVO" && montoRecibido !== undefined) {
    if (montoRecibido < totalConDescuento) {
      throw new ReglaBodegaError(`El efectivo recibido (C$ ${montoRecibido.toFixed(2)}) es menor que el total de la venta (C$ ${totalConDescuento.toFixed(2)}).`);
    }
    cambio = r2(montoRecibido - totalConDescuento);
  }

  const factura: Factura = {
    id: crypto.randomUUID(),
    numero: "",
    cliente: nombreCliente,
    clienteId: input.clienteId ?? cotizacion?.clienteId ?? null,
    fecha: fechaDoc,
    cotizacionId: cotizacion?.id ?? null,
    notas: (cotizacion?.notas || input.notas || "").trim(),
    creadoPor: input.creadoPor ?? "Cajero",
    estado: formaPagoFinal === "CREDITO" ? "EMITIDA" : "PAGADA",
    stockAplicado: false,
    formaPago: formaPagoFinal,
    origen: input.origen ?? (cotizacion ? "COTIZACION" : "DIRECTA"),
    items,
    subtotal,
    descuento,
    iva,
    isv,
    total: totalConDescuento,
    costoTotalVenta,
    montoRecibido,
    cambio,
    claveIdempotencia,
  };

  return aplicarDescargoFactura(db, factura, cotizacion, totalConDescuento, claveIdempotencia);
}
