import type { DB } from "@/lib/types";
import type { FiltroReporte } from "./engine-reports-sales";
import { totalesLineas } from "./engine-core";
import { r2 } from "@/lib/format";

export function reporteComprasPorProveedor(db: DB, filtros?: FiltroReporte) {
  const desde = filtros?.desde || "0000-00-00";
  const hasta = filtros?.hasta || "9999-99-99";
  const comprasValidas = (db.compras ?? []).filter((c) => !c.anulada && c.fecha >= desde && c.fecha <= hasta);

  const mapa = new Map<string, { proveedor: string; proveedorId: string | null; cantidadCompras: number; totalComprado: number; saldoPendiente: number }>();
  for (const c of comprasValidas) {
    const provNombre = c.proveedor || "Proveedor sin nombre";
    const actual = mapa.get(provNombre) || { proveedor: provNombre, proveedorId: c.proveedorId || null, cantidadCompras: 0, totalComprado: 0, saldoPendiente: 0 };
    const tot = c.total !== undefined ? c.total : totalesLineas(c.items).total;
    const saldo = c.saldoPendiente !== undefined ? c.saldoPendiente : (c.condicionPago === "CREDITO" ? tot : 0);
    actual.cantidadCompras += 1;
    actual.totalComprado = r2(actual.totalComprado + tot);
    actual.saldoPendiente = r2(actual.saldoPendiente + saldo);
    mapa.set(provNombre, actual);
  }

  const proveedores = Array.from(mapa.values()).sort((a, b) => b.totalComprado - a.totalComprado);
  return {
    desde, hasta, proveedores,
    totalCompradoGlobal: r2(proveedores.reduce((s, p) => s + p.totalComprado, 0)),
    totalSaldoPendienteGlobal: r2(proveedores.reduce((s, p) => s + p.saldoPendiente, 0)),
  };
}

export function reporteDevoluciones(db: DB, filtros?: FiltroReporte) {
  const desde = filtros?.desde || "0000-00-00";
  const hasta = filtros?.hasta || "9999-99-99";
  const devClientes = (db.devolucionesCliente ?? []).filter((d) => d.fecha >= desde && d.fecha <= hasta);
  const devProveedores = (db.devolucionesProveedor ?? []).filter((d) => d.fecha >= desde && d.fecha <= hasta);
  return {
    desde, hasta, devolucionesClientes: devClientes, devolucionesProveedores: devProveedores,
    totalReintegroClientes: r2(devClientes.reduce((s, d) => s + d.totalReintegro, 0)),
    totalReintegroProveedores: r2(devProveedores.reduce((s, d) => s + d.total, 0)),
  };
}

export function reporteValoracionInventario(db: DB) {
  const productos = db.productos.map((p) => {
    const stock = Math.max(0, p.stockActual);
    const costo = p.costo || 0;
    const precio = p.precio || 0;
    const valorCosto = r2(stock * costo);
    const valorPrecio = r2(stock * precio);
    return {
      id: p.id, codigo: p.codigo, nombre: p.nombre, categoria: p.categoria, marca: p.marca,
      unidadMedida: p.unidadMedida, stockActual: p.stockActual, stockMinimo: p.stockMinimo,
      costo, precio, valorCosto, valorPrecio, margenPotencial: r2(valorPrecio - valorCosto),
      alertaMinimo: p.stockMinimo !== null && p.stockMinimo !== undefined && p.stockActual <= p.stockMinimo,
    };
  }).sort((a, b) => b.valorCosto - a.valorCosto);

  return {
    productos,
    totalValorCosto: r2(productos.reduce((s, p) => s + p.valorCosto, 0)),
    totalValorPrecio: r2(productos.reduce((s, p) => s + p.valorPrecio, 0)),
    totalItemsEnBodega: productos.reduce((s, p) => s + Math.max(0, p.stockActual), 0),
    totalProductos: productos.length,
    productosBajoMinimo: productos.filter((p) => p.alertaMinimo).length,
  };
}

export function reporteCuentasPorPagar(db: DB) {
  const comprasPendientes = (db.compras ?? [])
    .filter((c) => !c.anulada && c.condicionPago === "CREDITO" && (c.saldoPendiente === undefined || c.saldoPendiente > 0.001))
    .map((c) => {
      const total = c.total !== undefined ? c.total : totalesLineas(c.items).total;
      const saldo = c.saldoPendiente !== undefined ? c.saldoPendiente : total;
      const abonos = (db.pagosCompra ?? []).filter((p) => p.compraId === c.id);
      return {
        compraId: c.id, numero: c.numero, facturaProveedor: c.facturaProveedor, proveedor: c.proveedor,
        proveedorId: c.proveedorId, fecha: c.fecha, fechaVencimiento: c.fechaVencimiento || "N/A",
        total, totalAbonado: r2(abonos.reduce((s, p) => s + p.monto, 0)), saldoPendiente: saldo,
        diasCredito: c.diasCredito || 30, estadoPago: c.estadoPago || "PARCIAL",
      };
    })
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));

  return {
    cuentas: comprasPendientes,
    totalSaldoPendiente: r2(comprasPendientes.reduce((s, c) => s + c.saldoPendiente, 0)),
    cantidadCuentas: comprasPendientes.length,
  };
}

export function reporteCuentasPorCobrar(db: DB) {
  const facturasCredito = db.facturas
    .filter((f) => f.formaPago === "CREDITO" && f.estado === "EMITIDA")
    .map((f) => {
      const total = f.total !== undefined ? f.total : totalesLineas(f.items).total;
      return {
        facturaId: f.id, numero: f.numero, cliente: f.cliente, clienteId: f.clienteId,
        fecha: f.fecha, total, saldoPendiente: total, creadoPor: f.creadoPor,
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return {
    cuentas: facturasCredito,
    totalPorCobrar: r2(facturasCredito.reduce((s, f) => s + f.saldoPendiente, 0)),
    cantidadCuentas: facturasCredito.length,
  };
}

export function reporteCajaYTurnos(db: DB, _filtros?: FiltroReporte) {
  const turnos = [...(db.turnosCaja ?? [])].sort((a, b) => b.fechaApertura.localeCompare(a.fechaApertura));
  return { turnos, turnoAbierto: turnos.find((t) => t.estado === "ABIERTO") || null, totalTurnos: turnos.length };
}
