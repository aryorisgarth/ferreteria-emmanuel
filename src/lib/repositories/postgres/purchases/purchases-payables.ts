import type { Compra, PagoCompra } from "@/lib/types";
import type { SqlExecutor } from "../client";
import type { AltaAbonoCompraInput } from "./types";

export async function obtenerCuentasPorPagar(executor: SqlExecutor): Promise<Compra[]> {
  const res = await executor.query(`
    SELECT 
      id, numero, factura_proveedor as "facturaProveedor", proveedor_id as "proveedorId",
      proveedor, fecha, notas, creado_por as "creadoPor", condicion_pago as "condicionPago",
      forma_pago as "formaPago", dias_credito as "diasCredito", fecha_vencimiento as "fechaVencimiento",
      saldo_pendiente::float as "saldoPendiente", estado_pago as "estadoPago",
      subtotal::float, descuento::float, iva::float, total::float
    FROM compras
    WHERE anulada = false AND saldo_pendiente > 0
    ORDER BY fecha ASC;
  `);
  return res.rows as Compra[];
}

export async function ejecutarAltaAbonoCompra(
  executor: SqlExecutor,
  input: AltaAbonoCompraInput,
  obtenerCompra: (id: string) => Promise<Compra | null>
): Promise<string> {
  const c = await obtenerCompra(input.compraId);
  if (!c) throw new Error("Compra no encontrada.");
  if (input.monto <= 0) throw new Error("El monto del abono debe ser mayor a cero.");
  if (input.monto > (c.saldoPendiente || 0)) {
    throw new Error(`El abono (C$ ${input.monto}) supera el saldo pendiente (C$ ${c.saldoPendiente}).`);
  }

  const pagoId = `pgo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const numRes = await executor.query(`
    INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('pago', 1)
    ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
    RETURNING ultimo_numero;
  `);
  const numPago = `PAG-${new Date().getFullYear()}-${String(numRes.rows[0].ultimo_numero).padStart(4, "0")}`;

  await executor.query(
    `INSERT INTO pagos_compra (
      id, numero, compra_id, proveedor_id, fecha, monto, forma_pago, referencia, notas, creado_por
    ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9);`,
    [
      pagoId, numPago, c.id, c.proveedorId, input.monto,
      input.formaPago || "TRANSFERENCIA", input.referencia || null,
      input.notas || "", input.creadoPor,
    ]
  );

  const nuevoSaldo = Math.max(0, (c.saldoPendiente || 0) - input.monto);
  const nuevoEstado = nuevoSaldo === 0 ? "PAGADO" : "PARCIAL";

  await executor.query(
    "UPDATE compras SET saldo_pendiente = $1, estado_pago = $2 WHERE id = $3;",
    [nuevoSaldo, nuevoEstado, c.id]
  );

  return pagoId;
}

export async function obtenerPagosDeCompra(executor: SqlExecutor, compraId: string): Promise<PagoCompra[]> {
  const res = await executor.query(
    `SELECT 
      id, numero, compra_id as "compraId", proveedor_id as "proveedorId",
      fecha, monto::float, forma_pago as "formaPago", referencia, notas,
      creado_por as "creadoPor", creado_en as "createdAt"
    FROM pagos_compra
    WHERE compra_id = $1
    ORDER BY fecha DESC;`,
    [compraId]
  );
  return res.rows as PagoCompra[];
}
