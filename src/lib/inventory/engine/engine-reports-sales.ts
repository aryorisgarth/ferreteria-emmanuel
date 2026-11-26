import type { DB, FormaPago } from "@/lib/types";
import { totalesLineas } from "./engine-core";
import { costoHistoricoFactura } from "./engine-sales-operations";
import { r2 } from "@/lib/format";

export interface FiltroReporte {
  desde?: string;
  hasta?: string;
  categoria?: string;
  marca?: string;
  usuario?: string;
  proveedorId?: string;
  clienteId?: string;
}

export function reporteVentasPorPeriodo(db: DB, filtros?: FiltroReporte) {
  const desde = filtros?.desde || "0000-00-00";
  const hasta = filtros?.hasta || "9999-99-99";
  const facturasValidas = db.facturas.filter((f) => f.estado !== "ANULADA" && f.fecha >= desde && f.fecha <= hasta);

  const renglones = facturasValidas
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero))
    .map((f) => {
      const costoVenta = costoHistoricoFactura(db, f);
      const subtotal = f.subtotal !== undefined ? f.subtotal : totalesLineas(f.items).subtotal;
      const iva = f.iva !== undefined ? f.iva : totalesLineas(f.items).iva;
      const total = f.total !== undefined ? f.total : totalesLineas(f.items).total;
      const descuento = f.descuento || 0;
      const utilidadBruta = r2(subtotal - costoVenta);
      const margenPorcentaje = subtotal > 0 ? r2((utilidadBruta / subtotal) * 100) : 0;
      return {
        facturaId: f.id, numero: f.numero, fecha: f.fecha, cliente: f.cliente, clienteId: f.clienteId,
        formaPago: f.formaPago, creadoPor: f.creadoPor, estado: f.estado, subtotal, descuento, iva, total,
        costoVenta, utilidadBruta, margenPorcentaje, cantidadItems: f.items.length,
      };
    });

  const totalFacturas = renglones.length;
  const totalSubtotal = r2(renglones.reduce((s, r) => s + r.subtotal, 0));
  const totalIva = r2(renglones.reduce((s, r) => s + r.iva, 0));
  const totalDescuentos = r2(renglones.reduce((s, r) => s + r.descuento, 0));
  const totalVendido = r2(renglones.reduce((s, r) => s + r.total, 0));
  const totalCostoVenta = r2(renglones.reduce((s, r) => s + r.costoVenta, 0));
  const totalUtilidadBruta = r2(totalSubtotal - totalCostoVenta);
  const margenPromedio = totalSubtotal > 0 ? r2((totalUtilidadBruta / totalSubtotal) * 100) : 0;

  return {
    desde, hasta, renglones,
    resumen: { totalFacturas, totalSubtotal, totalIva, totalDescuentos, totalVendido, totalCostoVenta, totalUtilidadBruta, margenPromedio },
  };
}

export function reporteVentasPorProducto(db: DB, filtros?: FiltroReporte) {
  const desde = filtros?.desde || "0000-00-00";
  const hasta = filtros?.hasta || "9999-99-99";
  const facturasValidas = db.facturas.filter((f) => f.estado !== "ANULADA" && f.fecha >= desde && f.fecha <= hasta);

  const mapa = new Map<string, {
    productoId: string; codigo: string; nombre: string; categoria: string; marca: string;
    unidadMedida: string; unidadesVendidas: number; montoTotalVendido: number; costoTotalHistorico: number;
  }>();

  for (const fac of facturasValidas) {
    for (const linea of fac.items) {
      const prod = db.productos.find((p) => p.id === linea.productoId);
      const actual = mapa.get(linea.productoId) || {
        productoId: linea.productoId, codigo: prod?.codigo || "N/A", nombre: prod?.nombre || "Artículo desconocido",
        categoria: prod?.categoria || "General", marca: prod?.marca || "Genérica",
        unidadMedida: linea.unidadMedida || prod?.unidadMedida || "UNIDAD",
        unidadesVendidas: 0, montoTotalVendido: 0, costoTotalHistorico: 0,
      };
      const costoUnit = linea.costoUnitario !== undefined ? linea.costoUnitario : (prod?.costo || 0);
      actual.unidadesVendidas = r2(actual.unidadesVendidas + linea.cantidad);
      actual.montoTotalVendido = r2(actual.montoTotalVendido + linea.cantidad * linea.precio);
      actual.costoTotalHistorico = r2(actual.costoTotalHistorico + linea.cantidad * costoUnit);
      mapa.set(linea.productoId, actual);
    }
  }

  const productosReporte = Array.from(mapa.values()).map((p) => {
    const utilidadBruta = r2(p.montoTotalVendido - p.costoTotalHistorico);
    const margenPorcentaje = p.montoTotalVendido > 0 ? r2((utilidadBruta / p.montoTotalVendido) * 100) : 0;
    return { ...p, utilidadBruta, margenPorcentaje };
  });

  return {
    desde, hasta,
    productos: [...productosReporte].sort((a, b) => b.unidadesVendidas - a.unidadesVendidas),
    masVendidosPorCantidad: [...productosReporte].sort((a, b) => b.unidadesVendidas - a.unidadesVendidas),
    masVendidosPorMonto: [...productosReporte].sort((a, b) => b.montoTotalVendido - a.montoTotalVendido),
    totalUnidades: r2(productosReporte.reduce((s, p) => s + p.unidadesVendidas, 0)),
    totalMonto: r2(productosReporte.reduce((s, p) => s + p.montoTotalVendido, 0)),
    totalUtilidad: r2(productosReporte.reduce((s, p) => s + p.utilidadBruta, 0)),
  };
}

export function reporteVentasPorCajero(db: DB, filtros?: FiltroReporte) {
  const desde = filtros?.desde || "0000-00-00";
  const hasta = filtros?.hasta || "9999-99-99";
  const facturasValidas = db.facturas.filter((f) => f.estado !== "ANULADA" && f.fecha >= desde && f.fecha <= hasta);

  const mapa = new Map<string, {
    cajero: string; cantidadFacturas: number; totalVendido: number;
    efectivo: number; transferencia: number; tarjeta: number; credito: number;
  }>();

  for (const f of facturasValidas) {
    const c = f.creadoPor || "Cajero general";
    const actual = mapa.get(c) || { cajero: c, cantidadFacturas: 0, totalVendido: 0, efectivo: 0, transferencia: 0, tarjeta: 0, credito: 0 };
    const total = f.total !== undefined ? f.total : totalesLineas(f.items).total;
    actual.cantidadFacturas += 1;
    actual.totalVendido = r2(actual.totalVendido + total);
    if (f.formaPago === "EFECTIVO") actual.efectivo = r2(actual.efectivo + total);
    else if (f.formaPago === "TRANSFERENCIA") actual.transferencia = r2(actual.transferencia + total);
    else if (f.formaPago === "TARJETA") actual.tarjeta = r2(actual.tarjeta + total);
    else if (f.formaPago === "CREDITO") actual.credito = r2(actual.credito + total);
    mapa.set(c, actual);
  }

  const cajeros = Array.from(mapa.values()).map((c) => ({
    ...c, ticketPromedio: c.cantidadFacturas > 0 ? r2(c.totalVendido / c.cantidadFacturas) : 0,
  })).sort((a, b) => b.totalVendido - a.totalVendido);

  return {
    desde, hasta, cajeros,
    totalVentas: r2(cajeros.reduce((s, c) => s + c.totalVendido, 0)),
    totalFacturas: cajeros.reduce((s, c) => s + c.cantidadFacturas, 0),
  };
}

export function reporteVentasPorMedioPago(db: DB, filtros?: FiltroReporte) {
  const desde = filtros?.desde || "0000-00-00";
  const hasta = filtros?.hasta || "9999-99-99";
  const facturasValidas = db.facturas.filter((f) => f.estado !== "ANULADA" && f.fecha >= desde && f.fecha <= hasta);
  const medios: Record<FormaPago, { cantidad: number; total: number; porcentaje: number }> = {
    EFECTIVO: { cantidad: 0, total: 0, porcentaje: 0 },
    TRANSFERENCIA: { cantidad: 0, total: 0, porcentaje: 0 },
    TARJETA: { cantidad: 0, total: 0, porcentaje: 0 },
    CREDITO: { cantidad: 0, total: 0, porcentaje: 0 },
    MIXTO: { cantidad: 0, total: 0, porcentaje: 0 },
  };

  let granTotal = 0;
  for (const f of facturasValidas) {
    const total = f.total !== undefined ? f.total : totalesLineas(f.items).total;
    const fp = f.formaPago || "EFECTIVO";
    if (!medios[fp]) medios[fp] = { cantidad: 0, total: 0, porcentaje: 0 };
    medios[fp].cantidad += 1;
    medios[fp].total = r2(medios[fp].total + total);
    granTotal = r2(granTotal + total);
  }

  for (const k of Object.keys(medios) as FormaPago[]) {
    medios[k].porcentaje = granTotal > 0 ? r2((medios[k].total / granTotal) * 100) : 0;
  }

  return { desde, hasta, medios, totalGeneral: granTotal, totalOperaciones: facturasValidas.length };
}
