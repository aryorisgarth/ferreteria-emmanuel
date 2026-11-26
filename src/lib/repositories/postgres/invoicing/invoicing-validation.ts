import type { SqlExecutor } from "../client";
import type { EmitirFacturaInput, LineaFacturaInput } from "./types";

export interface CotizacionBloqueada {
  datos: any;
  itemsById: Map<string, any>;
  itemsByProd: Map<string, any>;
}

export async function validarIdempotenciaFactura(executor: SqlExecutor, clave?: string): Promise<string | null> {
  if (!clave) return null;
  const res = await executor.query(`SELECT id FROM facturas WHERE clave_idempotencia = $1`, [clave]);
  return res.rows.length > 0 ? (res.rows[0].id as string) : null;
}

export async function validarYBloquearCotizacion(
  executor: SqlExecutor,
  cotizacionId: string,
  items: LineaFacturaInput[]
): Promise<CotizacionBloqueada> {
  const cotRes = await executor.query(
    `SELECT id, numero, version, es_version_actual, estado, cliente_id, subtotal, iva, total
     FROM cotizaciones WHERE id = $1 FOR UPDATE`,
    [cotizacionId]
  );
  if (cotRes.rows.length === 0) throw new Error(`La cotización con ID '${cotizacionId}' no existe.`);
  const cotData = cotRes.rows[0];
  if (cotData.es_version_actual === false) {
    throw new Error(`Operación denegada: La cotización ${cotData.numero} (v${cotData.version}) ha sido sustituida por una versión posterior.`);
  }
  const estadosPermitidos = ["AUTORIZADA", "PARCIALMENTE_FACTURADA", "EMITIDA", "ACEPTADA"];
  if (!estadosPermitidos.includes(cotData.estado)) {
    throw new Error(`La cotización ${cotData.numero} está en estado '${cotData.estado}'. Solo se permite facturar cotizaciones autorizadas.`);
  }

  const itemsRes = await executor.query(
    `SELECT id, cotizacion_id, producto_id, cantidad, cantidad_facturada, cantidad_cancelada, cantidad_pendiente, precio, precio_autorizado
     FROM cotizacion_items WHERE cotizacion_id = $1 ORDER BY id ASC FOR UPDATE`,
    [cotizacionId]
  );
  const itemsById = new Map<string, any>();
  const itemsByProd = new Map<string, any>();
  for (const ci of itemsRes.rows) {
    itemsById.set(ci.id, ci);
    itemsByProd.set(ci.producto_id, ci);
  }

  for (const it of items) {
    const ci = (it.cotizacionItemId ? itemsById.get(it.cotizacionItemId) : null) || itemsByProd.get(it.productoId);
    if (ci) {
      const pend = Number(ci.cantidad_pendiente !== undefined ? ci.cantidad_pendiente : ci.cantidad);
      if (it.cantidad > pend + 0.0001) {
        throw new Error(`La cantidad solicitada (${it.cantidad}) supera el saldo pendiente (${pend}) de la cotización ${cotData.numero}.`);
      }
    }
  }
  return { datos: cotData, itemsById, itemsByProd };
}

export async function bloquearYValidarStock(executor: SqlExecutor, items: LineaFacturaInput[]): Promise<Map<string, any>> {
  const productIds = Array.from(new Set(items.map((i) => i.productoId))).sort();
  const locked = await executor.query(
    `SELECT id, codigo, nombre, unidad_medida as "unidadMedida",
            stock_actual::float as "stockActual", costo::float, precio::float, activo
     FROM productos WHERE id = ANY($1) ORDER BY id ASC FOR UPDATE`,
    [productIds]
  );
  const map = new Map<string, any>();
  for (const r of locked.rows) map.set(r.id, r);

  for (const it of items) {
    const prod = map.get(it.productoId);
    if (!prod) throw new Error(`Producto ${it.productoId} no encontrado en catálogo`);
    if (!prod.activo) throw new Error(`El producto "${prod.nombre}" está desactivado`);
    if (it.cantidad <= 0) throw new Error(`Cantidad inválida para ${prod.nombre}`);
    if (prod.stockActual < it.cantidad) {
      throw new Error(`Existencias insuficientes para "${prod.nombre}". Solicitado: ${it.cantidad}, Disponible: ${prod.stockActual}`);
    }
  }
  return map;
}

export async function validarTurnoCaja(executor: SqlExecutor, input: EmitirFacturaInput): Promise<string | null> {
  const origen = input.origen || "DIRECTA";
  const formaPago = input.formaPago || "EFECTIVO";
  if ((formaPago === "EFECTIVO" || formaPago === "MIXTO") && origen === "CAJA") {
    const turnoRes = await executor.query(
      `SELECT id FROM turnos_caja WHERE usuario = $1 AND estado = 'ABIERTO' ORDER BY fecha_apertura DESC LIMIT 1`,
      [input.creadoPor]
    );
    if (turnoRes.rows.length === 0) {
      throw new Error(`El cajero "${input.creadoPor}" no tiene un turno de caja abierto para registrar el cobro en efectivo.`);
    }
    return turnoRes.rows[0].id;
  }
  return null;
}

export async function validarCreditoCliente(executor: SqlExecutor, clienteId: string | undefined | null, totalFactura: number): Promise<void> {
  if (!clienteId) throw new Error("Para ventas al crédito es obligatorio seleccionar un cliente registrado.");
  const res = await executor.query(
    `SELECT id, nombre, activo, coalesce(limite_credito, 0)::float as "limiteCredito"
     FROM clientes WHERE id = $1 FOR UPDATE`,
    [clienteId]
  );
  if (res.rows.length === 0) throw new Error("El cliente especificado para el crédito no existe en la base de datos.");
  const cl = res.rows[0];
  if (!cl.activo) throw new Error(`El cliente "${cl.nombre}" está inactivo y no tiene autorización para compras a crédito.`);
  if (cl.limiteCredito <= 0) throw new Error(`El cliente "${cl.nombre}" no tiene línea de crédito autorizada.`);

  const saldoRes = await executor.query(
    `SELECT coalesce(sum(f.total), 0)::float as "saldoFacturas"
     FROM facturas f WHERE f.cliente_id = $1 AND f.forma_pago = 'CREDITO' AND f.estado = 'EMITIDA' AND f.anulada = false`,
    [clienteId]
  );
  const saldoFacturas = Number(saldoRes.rows[0]?.saldoFacturas || 0);
  const nuevoSaldo = Math.round((saldoFacturas + totalFactura) * 100) / 100;
  if (nuevoSaldo > cl.limiteCredito) {
    throw new Error(
      `Límite de crédito excedido para "${cl.nombre}". Saldo actual: C$ ${saldoFacturas.toFixed(2)}, nueva venta: C$ ${totalFactura.toFixed(2)}, total resultante: C$ ${nuevoSaldo.toFixed(2)}, límite: C$ ${cl.limiteCredito.toFixed(2)}.`
    );
  }
}
