import type { DB } from "@/lib/types";
import { totalesLineas } from "./engine-core";
import { costoHistoricoFactura } from "./engine-sales-operations";
import { vistaProductos } from "./engine-products";
import { totalDelDia } from "./engine-kardex-import";
import { turnoActivo } from "./engine-cash";
import { r2 } from "@/lib/format";

export function resumenNegocio(db: DB, fecha: string) {
  const facturasValidas = db.facturas.filter((f) => f.estado !== "ANULADA");

  // Métricas del Día
  const facturasHoy = facturasValidas.filter((f) => f.fecha === fecha);
  const ventasHoy = r2(facturasHoy.reduce((suma, f) => suma + (f.total !== undefined ? f.total : totalesLineas(f.items).total), 0));
  const subtotalHoy = r2(facturasHoy.reduce((suma, f) => suma + (f.subtotal !== undefined ? f.subtotal : totalesLineas(f.items).subtotal), 0));
  const cobradoHoy = r2(
    facturasHoy.filter((f) => f.estado === "PAGADA").reduce((suma, f) => suma + (f.total !== undefined ? f.total : totalesLineas(f.items).total), 0),
  );
  const costoHoy = r2(facturasHoy.reduce((suma, f) => suma + costoHistoricoFactura(db, f), 0));
  const gastosHoy = r2((db.gastos ?? []).filter((g) => g.fecha === fecha).reduce((suma, g) => suma + g.monto, 0));
  const utilidadBrutaDia = r2(subtotalHoy - costoHoy);
  const utilidadNetaDia = r2(utilidadBrutaDia - gastosHoy);

  // Métricas del Mes (AAAA-MM)
  const prefijoMes = fecha.slice(0, 7);
  const facturasMes = facturasValidas.filter((f) => f.fecha.startsWith(prefijoMes));
  const ventasMes = r2(facturasMes.reduce((suma, f) => suma + (f.total !== undefined ? f.total : totalesLineas(f.items).total), 0));
  const subtotalMes = r2(facturasMes.reduce((suma, f) => suma + (f.subtotal !== undefined ? f.subtotal : totalesLineas(f.items).subtotal), 0));
  const cobradoMes = r2(
    facturasMes.filter((f) => f.estado === "PAGADA").reduce((suma, f) => suma + (f.total !== undefined ? f.total : totalesLineas(f.items).total), 0),
  );
  const costoMes = r2(facturasMes.reduce((suma, f) => suma + costoHistoricoFactura(db, f), 0));
  const gastosMes = r2((db.gastos ?? []).filter((g) => g.fecha.startsWith(prefijoMes)).reduce((suma, g) => suma + g.monto, 0));
  const utilidadBrutaMes = r2(subtotalMes - costoMes);
  const utilidadNetaMes = r2(utilidadBrutaMes - gastosMes);

  // Cuentas por Cobrar (Facturas a crédito EMITIDAS no saldadas)
  const facturasPorCobrar = db.facturas.filter((f) => f.formaPago === "CREDITO" && f.estado === "EMITIDA");
  const porCobrar = r2(
    facturasPorCobrar.reduce((suma, f) => suma + (f.total !== undefined ? f.total : totalesLineas(f.items).total), 0),
  );

  // Cuentas por Pagar (Compras a crédito no anuladas con saldo pendiente)
  const comprasValidas = (db.compras ?? []).filter((c) => !c.anulada);
  const comprasPorPagar = comprasValidas.filter(
    (c) => c.condicionPago === "CREDITO" && (c.saldoPendiente === undefined || c.saldoPendiente > 0.001)
  );
  const cuentasPorPagar = r2(
    comprasPorPagar.reduce((suma, c) => suma + (c.saldoPendiente !== undefined ? c.saldoPendiente : c.total ?? 0), 0)
  );

  // Valoración Patrimonial de Inventario (al CPP vigente)
  const vista = vistaProductos(db);
  const valorInventario = r2(db.productos.reduce((suma, p) => suma + Math.max(0, p.stockActual) * (p.costo || 0), 0));
  const valorInventarioVenta = r2(db.productos.reduce((suma, p) => suma + Math.max(0, p.stockActual) * (p.precio || 0), 0));

  // Turno de Caja Actual
  const turno = turnoActivo(db);

  // Operaciones Recientes
  const comprasRecientes = [...comprasValidas]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  const solicitudes = db.solicitudes ?? [];

  return {
    fecha,
    ventas: ventasHoy,
    ventasDia: ventasHoy,
    ventasHoy,
    subtotalDia: subtotalHoy,
    cobrado: cobradoHoy,
    cobradoDia: cobradoHoy,
    costoHoy,
    gastosHoy,
    utilidadBrutaDia,
    utilidadNetaDia,
    utilidad: utilidadNetaDia,
    ventasMes,
    subtotalMes,
    cobradoMes,
    costoMes,
    gastosMes,
    utilidadBrutaMes,
    utilidadNetaMes,
    porCobrar,
    cuentasPorCobrar: porCobrar,
    cuentasPorPagar,
    valorInventario,
    valorInventarioVenta,
    productos: db.productos.length,
    cotizaciones: (db.cotizaciones ?? []).length,
    facturas: db.facturas.length,
    clientes: (db.clientes ?? []).length,
    proveedores: (db.proveedores ?? []).length,
    conteos: {
      PENDIENTE_DE_REVISION: solicitudes.filter((s) => s.estado === "PENDIENTE_DE_REVISION").length,
      APROBADO: solicitudes.filter((s) => s.estado === "APROBADO").length,
      ENTREGADO: solicitudes.filter((s) => s.estado === "ENTREGADO").length,
    },
    stockBajo: vista.filter((p) => p.stockMinimo !== null && p.stockMinimo !== undefined && p.stockActual <= p.stockMinimo && p.stockActual > 0),
    sinExistencia: vista.filter((p) => p.stockActual <= 0),
    despachos: totalDelDia(db, fecha),
    turno,
    comprasRecientes,
  };
}
