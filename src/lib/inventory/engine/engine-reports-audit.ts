import type { DB } from "@/lib/types";
import type { FiltroReporte } from "./engine-reports-sales";

export interface EventoAuditoria {
  id: string;
  fecha: string;
  tipo: "ANULACION_FACTURA" | "ANULACION_COMPRA" | "AJUSTE_INVENTARIO" | "DEVOLUCION_CLIENTE" | "DEVOLUCION_PROVEEDOR" | "MOVIMIENTO_CAJA" | "CONTEO_FISICO";
  referencia: string;
  responsable: string;
  descripcion: string;
  montoOImpacto?: string | number;
}

export function reporteAuditoriaTrazabilidad(db: DB, filtros?: FiltroReporte): EventoAuditoria[] {
  const desde = filtros?.desde || "0000-00-00";
  const hasta = filtros?.hasta || "9999-99-99";
  const eventos: EventoAuditoria[] = [];

  for (const f of db.facturas) {
    if (f.estado === "ANULADA" || f.anulada) {
      const fecha = (f.fechaAnulacion || f.fecha).slice(0, 10);
      if (fecha >= desde && fecha <= hasta) {
        eventos.push({
          id: `AUD-FAC-ANUL-${f.id}`, fecha, tipo: "ANULACION_FACTURA", referencia: f.numero || f.id.slice(0, 8),
          responsable: f.anuladaPor || "Administrador",
          descripcion: `Factura anulada. Motivo: ${f.motivoAnulacion || "Sin motivo especificado"}. Cliente: ${f.cliente}`,
          montoOImpacto: `C$ ${f.total?.toFixed(2) || "0.00"} (restituido a stock)`,
        });
      }
    }
  }

  for (const c of (db.compras ?? [])) {
    if (c.anulada) {
      const fecha = (c.fechaAnulacion || c.fecha).slice(0, 10);
      if (fecha >= desde && fecha <= hasta) {
        eventos.push({
          id: `AUD-COM-ANUL-${c.id}`, fecha, tipo: "ANULACION_COMPRA", referencia: c.numero || c.id.slice(0, 8),
          responsable: c.anuladaPor || "Administrador",
          descripcion: `Compra a ${c.proveedor} anulada. Motivo: ${c.motivoAnulacion || "Sin motivo"}`,
          montoOImpacto: `C$ ${c.total?.toFixed(2) || "0.00"}`,
        });
      }
    }
  }

  for (const a of (db.ajustesInventario ?? [])) {
    if (a.fecha >= desde && a.fecha <= hasta) {
      const p = db.productos.find((pr) => pr.id === a.productoId);
      eventos.push({
        id: `AUD-AJU-${a.id}`, fecha: a.fecha, tipo: "AJUSTE_INVENTARIO", referencia: a.numero, responsable: a.usuario,
        descripcion: `Ajuste de inventario ${a.tipo}: ${a.cantidad} ${p?.unidadMedida || "unidades"} en "${p?.nombre || a.productoId}". Motivo: ${a.motivo}`,
        montoOImpacto: `${a.tipo === "SOBRANTE" ? "+" : "-"}${a.cantidad} un.`,
      });
    }
  }

  for (const dc of (db.devolucionesCliente ?? [])) {
    if (dc.fecha >= desde && dc.fecha <= hasta) {
      eventos.push({
        id: `AUD-DEV-CLI-${dc.id}`, fecha: dc.fecha, tipo: "DEVOLUCION_CLIENTE", referencia: dc.numero,
        responsable: dc.responsable, descripcion: `Devolución de cliente (${dc.cliente}) de factura ${dc.facturaNumero}. Motivo: ${dc.motivo}`,
        montoOImpacto: `Reintegro: C$ ${dc.totalReintegro.toFixed(2)} (${dc.metodoReintegro})`,
      });
    }
  }

  for (const dp of (db.devolucionesProveedor ?? [])) {
    if (dp.fecha >= desde && dp.fecha <= hasta) {
      eventos.push({
        id: `AUD-DEV-PROV-${dp.id}`, fecha: dp.fecha, tipo: "DEVOLUCION_PROVEEDOR", referencia: dp.numero,
        responsable: dp.creadoPor, descripcion: `Devolución a proveedor (${dp.proveedor}). Motivo: ${dp.motivo}`,
        montoOImpacto: `Salida de almacén: C$ ${dp.total.toFixed(2)}`,
      });
    }
  }

  for (const mc of (db.movimientosCaja ?? [])) {
    if (mc.fecha >= desde && mc.fecha <= hasta) {
      eventos.push({
        id: `AUD-CAJA-MOV-${mc.id}`, fecha: mc.fecha, tipo: "MOVIMIENTO_CAJA", referencia: mc.id.slice(0, 8),
        responsable: mc.usuario, descripcion: `Movimiento manual de caja (${mc.tipo}): ${mc.concepto}`,
        montoOImpacto: `${mc.tipo === "INGRESO" ? "+" : "-"}C$ ${mc.monto.toFixed(2)}`,
      });
    }
  }

  for (const cf of (db.conteosFisicos ?? [])) {
    if (cf.estado === "APLICADO" && cf.fecha >= desde && cf.fecha <= hasta) {
      const discrepancias = cf.items.filter((it) => it.diferencia !== 0).length;
      eventos.push({
        id: `AUD-CONF-${cf.id}`, fecha: cf.fecha, tipo: "CONTEO_FISICO", referencia: cf.numero,
        responsable: cf.usuario || "Administrador",
        descripcion: `Auditoría física de inventario aplicada con ${discrepancias} discrepancias conciliadas.`,
        montoOImpacto: `${cf.items.length} artículos auditados`,
      });
    }
  }

  return eventos.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
}

export function generarRespaldoDatos(db: DB, config?: any) {
  const timestamp = new Date().toISOString();
  const conteos = {
    productos: db.productos.length, facturas: db.facturas.length, compras: (db.compras ?? []).length,
    cotizaciones: (db.cotizaciones ?? []).length, movimientos: db.movimientos.length, clientes: (db.clientes ?? []).length,
    proveedores: (db.proveedores ?? []).length, turnosCaja: (db.turnosCaja ?? []).length,
    ajustesInventario: (db.ajustesInventario ?? []).length,
  };

  return {
    formato: "FERRETERIA_EMMANUEL_BACKUP_V1",
    empresa: config?.empresa?.nombre || "Ferretería Emmanuel S.A.",
    timestamp, versionEsquema: "2.0", schemaVersion: "2.0", conteos, controles: conteos,
    datos: { db, configuracion: config || null },
  };
}

export function verificarIntegridadRespaldo(payload: any): { valido: boolean; errores: string[]; detalles: any } {
  const errores: string[] = [];
  if (!payload || typeof payload !== "object") return { valido: false, errores: ["El archivo no contiene un objeto JSON válido."], detalles: null };
  if (payload.formato !== "FERRETERIA_EMMANUEL_BACKUP_V1") errores.push("Firma o encabezado de formato de respaldo no reconocido.");
  const db = payload.datos?.db;
  if (!db || typeof db !== "object") return { valido: false, errores: [...errores, "El respaldo no contiene la estructura de base de datos comercial (datos.db)."], detalles: null };

  for (const tabla of ["productos", "facturas", "movimientos"] as Array<keyof DB>) {
    if (!Array.isArray(db[tabla])) errores.push(`La tabla esencial "${String(tabla)}" está ausente o no es un arreglo.`);
  }

  const c = payload.controles || payload.conteos;
  if (c && typeof c === "object") {
    if (Array.isArray(db.productos) && db.productos.length !== c.productos) errores.push(`Discrepancia en conteo de productos: Declarados ${c.productos}, encontrados ${db.productos.length}.`);
    if (Array.isArray(db.facturas) && db.facturas.length !== c.facturas) errores.push(`Discrepancia en conteo de facturas: Declaradas ${c.facturas}, encontradas ${db.facturas.length}.`);
    if (Array.isArray(db.movimientos) && db.movimientos.length !== c.movimientos) errores.push(`Discrepancia en kárdex: Declarados ${c.movimientos}, encontrados ${db.movimientos.length}.`);
  }

  return {
    valido: errores.length === 0, errores,
    detalles: {
      empresa: payload.empresa, timestamp: payload.timestamp,
      conteosReales: { productos: db.productos?.length || 0, facturas: db.facturas?.length || 0, compras: db.compras?.length || 0, movimientos: db.movimientos?.length || 0 },
    },
  };
}
