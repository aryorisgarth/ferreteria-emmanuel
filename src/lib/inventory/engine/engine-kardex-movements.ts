import { r3 } from "@/lib/format";
import type { Acta, DB, LineaCaptura } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import {
  asegurarDisponible,
  conStock,
  exigirOficina,
  exigirProducto,
  movimientoNuevo,
  siguiente,
} from "./engine-helpers";
import { recalcularProducto } from "./engine-products";

export function registrarEntrada(
  db: DB,
  input: {
    productoId: string;
    cantidad: number;
    fecha: string;
    concepto: string;
    usuario: string;
    esAuditoria: boolean;
    costoUnitario?: number;
    origen?: "MANUAL" | "EXCEL" | "COMPRA";
  },
) {
  if (!input.costoUnitario || input.costoUnitario <= 0) {
    throw new ReglaBodegaError(
      "Entrada no autorizada: Toda incorporación de mercadería requiere un costo de adquisición unitario mayor que cero y debe registrarse formalmente en Compras para proteger el Costo Promedio Ponderado (CPP)."
    );
  }
  if (input.origen !== "COMPRA") {
    throw new ReglaBodegaError(
      "Entrada manual no autorizada: Toda incorporación de mercadería debe registrarse a través del módulo de Compras para asociar proveedor, factura y costeo válido. No se permiten entradas manuales sin valoración formal para proteger el Costo Promedio Ponderado (CPP)."
    );
  }
  if (!input.concepto.trim()) throw new ReglaBodegaError("El concepto del movimiento es obligatorio.");
  if (input.cantidad <= 0) throw new ReglaBodegaError("La entrada debe ser mayor que cero.");
  const producto = exigirProducto(db, input.productoId);
  const mov = movimientoNuevo(db, {
    productoId: producto.id,
    fecha: input.fecha,
    tipo: "ENTRADA",
    cantidad: input.cantidad,
    destinatario: "",
    oficinaId: null,
    actaId: null,
    actaItemId: null,
    solicitudId: null,
    solicitudItemId: null,
    numeroReferencia: `ENT-${input.fecha.replaceAll("-", "")}`,
    concepto: input.concepto.trim(),
    usuario: input.usuario,
    esAuditoria: input.esAuditoria,
    origen: input.origen ?? "MANUAL",
    idempotencyKey: null,
  });
  conStock(db, [producto.id], () => {
    db.movimientos.push(mov);
  }, recalcularProducto);
  return mov;
}

export function salidaDirecta(
  db: DB,
  input: {
    oficinaId: string;
    destinatario: string;
    fecha: string;
    concepto: string;
    usuario: string;
    esAuditoria: boolean;
    items: LineaCaptura[];
  },
) {
  if (!input.destinatario.trim()) {
    throw new ReglaBodegaError("Toda salida exige destinatario, persona u oficina.");
  }
  if (!input.concepto.trim()) throw new ReglaBodegaError("El concepto del movimiento es obligatorio.");
  if (!input.items.length) throw new ReglaBodegaError("La salida directa no tiene artículos.");
  const oficina = exigirOficina(db, input.oficinaId);
  const destino = input.destinatario.trim();
  const preparadas = input.items.map((item) => {
    const producto = exigirProducto(db, item.productoId);
    if (item.cantidad <= 0) throw new ReglaBodegaError("Cada renglón debe tener una cantidad mayor que cero.");
    return { producto, cantidad: r3(item.cantidad), observacion: item.observacion?.trim() || "" };
  });
  asegurarDisponible(
    db,
    preparadas.map((item) => ({ productoId: item.producto.id, cantidad: item.cantidad })),
  );

  const acta: Acta = {
    id: crypto.randomUUID(),
    numero: siguiente(db, "acta", input.fecha),
    solicitudId: null,
    esSalidaDirecta: true,
    oficinaId: oficina.id,
    destinatario: destino,
    fecha: input.fecha,
    concepto: input.concepto.trim(),
    ejecutada: false,
    items: preparadas.map((item) => ({
      id: crypto.randomUUID(),
      productoId: item.producto.id,
      cantidad: item.cantidad,
      unidadMedida: item.producto.unidadMedida,
      observacion: item.observacion,
    })),
  };

  conStock(
    db,
    acta.items.map((linea) => linea.productoId),
    () => {
      db.actas.push(acta);
      for (const linea of acta.items) {
        db.movimientos.push(
          movimientoNuevo(db, {
            productoId: linea.productoId,
            fecha: input.fecha,
            tipo: "SALIDA",
            cantidad: linea.cantidad,
            destinatario: destino,
            oficinaId: oficina.id,
            actaId: acta.id,
            actaItemId: linea.id,
            solicitudId: null,
            solicitudItemId: null,
            numeroReferencia: acta.numero,
            concepto: acta.concepto,
            usuario: input.usuario,
            esAuditoria: input.esAuditoria,
            origen: "SALIDA_DIRECTA",
            idempotencyKey: `ACTA:${acta.id}:ITEM:${linea.id}`,
          }),
        );
      }
    },
    recalcularProducto
  );
  acta.ejecutada = true;
  return acta;
}
