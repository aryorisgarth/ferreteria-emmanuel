import type { TurnoCaja, MovimientoCaja, Gasto, Pagina } from "@/lib/types";
import type { SqlExecutor } from "./client";

export class PostgresCashService {
  constructor(private executor: SqlExecutor) {}

  // --- TURNOS DE CAJA ---
  async turnoActivo(usuario?: string): Promise<TurnoCaja | null> {
    const whereClause = usuario ? "WHERE usuario = $1 AND estado = 'ABIERTO'" : "WHERE estado = 'ABIERTO'";
    const params = usuario ? [usuario] : [];

    const res = await this.executor.query(
      `
      SELECT 
        id, numero, usuario, fecha_apertura as "fechaApertura", fecha_cierre as "fechaCierre",
        monto_inicial::float as "montoInicial", monto_final_real::float as "montoFinalReal",
        diferencia::float, total_ventas_efectivo::float as "totalVentasEfectivo",
        total_ventas_transferencia::float as "totalVentasTransferencia",
        total_ventas_tarjeta::float as "totalVentasTarjeta",
        total_ventas_credito::float as "totalVentasCredito",
        total_ingresos_extra::float as "totalIngresosExtra",
        total_egresos::float as "totalEgresos", estado, notas
      FROM turnos_caja
      ${whereClause}
      ORDER BY fecha_apertura DESC
      LIMIT 1;
    `,
      params
    );

    if (res.rows.length === 0) return null;
    return res.rows[0] as TurnoCaja;
  }

  async abrirTurno(input: { usuario: string; montoInicial: number; notas?: string }): Promise<TurnoCaja> {
    const activo = await this.turnoActivo(input.usuario);
    if (activo) {
      throw new Error(`El usuario ${input.usuario} ya tiene un turno abierto activo (${activo.numero}).`);
    }

    const turnoId = `trn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const numRes = await this.executor.query(`
      INSERT INTO consecutivos_folios (tipo, ultimo_numero) VALUES ('turno', 1)
      ON CONFLICT (tipo) DO UPDATE SET ultimo_numero = consecutivos_folios.ultimo_numero + 1
      RETURNING ultimo_numero;
    `);
    const numSeq = numRes.rows[0].ultimo_numero;
    const numero = `TUR-${new Date().getFullYear()}-${String(numSeq).padStart(4, "0")}`;

    await this.executor.query(
      `
      INSERT INTO turnos_caja (
        id, numero, usuario, fecha_apertura, monto_inicial, estado, notas
      ) VALUES ($1, $2, $3, NOW(), $4, 'ABIERTO', $5);
    `,
      [turnoId, numero, input.usuario, input.montoInicial || 0, input.notas || ""]
    );

    return (await this.turnoActivo(input.usuario))!;
  }

  async cerrarTurno(input: { turnoId: string; montoFinalReal: number; notas?: string }): Promise<TurnoCaja> {
    const res = await this.executor.query("SELECT * FROM turnos_caja WHERE id = $1 LIMIT 1;", [input.turnoId]);
    if (res.rows.length === 0) throw new Error("Turno de caja no encontrado.");
    const t = res.rows[0];
    if (t.estado === "CERRADO") throw new Error("El turno ya se encuentra cerrado.");

    // Calcular esperado en efectivo: montoInicial + ventasEfectivo + ingresosExtra - egresos
    const esperado =
      parseFloat(t.monto_inicial) +
      parseFloat(t.total_ventas_efectivo) +
      parseFloat(t.total_ingresos_extra) -
      parseFloat(t.total_egresos);
    const diferencia = input.montoFinalReal - esperado;

    await this.executor.query(
      `
      UPDATE turnos_caja SET
        fecha_cierre = NOW(),
        monto_final_real = $1,
        diferencia = $2,
        estado = 'CERRADO',
        notas = COALESCE($3, notas)
      WHERE id = $4;
    `,
      [input.montoFinalReal, diferencia, input.notas || t.notas, input.turnoId]
    );

    const closedRes = await this.executor.query(
      `
      SELECT 
        id, numero, usuario, fecha_apertura as "fechaApertura", fecha_cierre as "fechaCierre",
        monto_inicial::float as "montoInicial", monto_final_real::float as "montoFinalReal",
        diferencia::float, total_ventas_efectivo::float as "totalVentasEfectivo",
        total_ventas_transferencia::float as "totalVentasTransferencia",
        total_ventas_tarjeta::float as "totalVentasTarjeta",
        total_ventas_credito::float as "totalVentasCredito",
        total_ingresos_extra::float as "totalIngresosExtra",
        total_egresos::float as "totalEgresos", estado, notas
      FROM turnos_caja WHERE id = $1;
    `,
      [input.turnoId]
    );

    return closedRes.rows[0] as TurnoCaja;
  }

  async registrarMovimientoCaja(input: {
    turnoCajaId: string;
    tipo: "INGRESO" | "EGRESO";
    monto: number;
    concepto: string;
    usuario: string;
  }): Promise<MovimientoCaja> {
    if (input.monto <= 0) throw new Error("El monto del movimiento de caja debe ser mayor a cero.");

    const movId = `mcaj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await this.executor.query(
      `
      INSERT INTO movimientos_caja (id, turno_caja_id, tipo, monto, concepto, fecha, usuario)
      VALUES ($1, $2, $3, $4, $5, NOW(), $6);
    `,
      [movId, input.turnoCajaId, input.tipo, input.monto, input.concepto, input.usuario]
    );

    // Actualizar acumuladores del turno
    if (input.tipo === "INGRESO") {
      await this.executor.query(
        "UPDATE turnos_caja SET total_ingresos_extra = total_ingresos_extra + $1 WHERE id = $2;",
        [input.monto, input.turnoCajaId]
      );
    } else {
      await this.executor.query(
        "UPDATE turnos_caja SET total_egresos = total_egresos + $1 WHERE id = $2;",
        [input.monto, input.turnoCajaId]
      );
    }

    const res = await this.executor.query(
      `
      SELECT id, turno_caja_id as "turnoCajaId", tipo, monto::float, concepto, fecha, usuario
      FROM movimientos_caja WHERE id = $1;
    `,
      [movId]
    );

    return res.rows[0] as MovimientoCaja;
  }

  async turnos(page: number = 1): Promise<Pagina<TurnoCaja>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);

    const countRes = await this.executor.query("SELECT COUNT(*) as total FROM turnos_caja;");
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, numero, usuario, fecha_apertura as "fechaApertura", fecha_cierre as "fechaCierre",
        monto_inicial::float as "montoInicial", monto_final_real::float as "montoFinalReal",
        diferencia::float, total_ventas_efectivo::float as "totalVentasEfectivo",
        total_ventas_transferencia::float as "totalVentasTransferencia",
        total_ventas_tarjeta::float as "totalVentasTarjeta",
        total_ventas_credito::float as "totalVentasCredito",
        total_ingresos_extra::float as "totalIngresosExtra",
        total_egresos::float as "totalEgresos", estado, notas
      FROM turnos_caja
      ORDER BY fecha_apertura DESC
      LIMIT $1 OFFSET $2;
    `,
      [limit, offset]
    );

    return { rows: rowsRes.rows as TurnoCaja[], page, pages, total };
  }

  async movimientosTurno(turnoId: string): Promise<MovimientoCaja[]> {
    const res = await this.executor.query(
      `
      SELECT id, turno_caja_id as "turnoCajaId", tipo, monto::float, concepto, fecha, usuario
      FROM movimientos_caja
      WHERE turno_caja_id = $1
      ORDER BY fecha ASC;
    `,
      [turnoId]
    );
    return res.rows as MovimientoCaja[];
  }

  // --- GASTOS OPERATIVOS ---
  async gastos(page: number = 1): Promise<Pagina<Gasto>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);

    const countRes = await this.executor.query("SELECT COUNT(*) as total FROM gastos;");
    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT id, to_char(fecha, 'YYYY-MM-DD') as fecha, concepto, categoria, monto::float, notas, creado_por as "creadoPor"
      FROM gastos
      ORDER BY fecha DESC
      LIMIT $1 OFFSET $2;
    `,
      [limit, offset]
    );

    return { rows: rowsRes.rows as Gasto[], page, pages, total };
  }

  async todosLosGastos(): Promise<Gasto[]> {
    const res = await this.executor.query(`
      SELECT id, to_char(fecha, 'YYYY-MM-DD') as fecha, concepto, categoria, monto::float, notas, creado_por as "creadoPor"
      FROM gastos
      ORDER BY fecha DESC;
    `);
    return res.rows as Gasto[];
  }

  async gasto(id: string): Promise<Gasto | null> {
    const res = await this.executor.query(
      `
      SELECT id, to_char(fecha, 'YYYY-MM-DD') as fecha, concepto, categoria, monto::float, notas, creado_por as "creadoPor"
      FROM gastos
      WHERE id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0] as Gasto;
  }

  async altaGasto(input: {
    fecha?: string;
    concepto: string;
    categoria: string;
    monto: number;
    notas?: string;
    creadoPor: string;
    turnoCajaId?: string | null;
  }): Promise<Gasto> {
    if (input.monto <= 0) throw new Error("El monto del gasto debe ser mayor a cero.");

    const gastoId = `gst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await this.executor.query(
      `
      INSERT INTO gastos (id, fecha, concepto, categoria, monto, notas, creado_por, turno_caja_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `,
      [
        gastoId,
        input.fecha || new Date().toISOString(),
        input.concepto.trim(),
        input.categoria.trim(),
        input.monto,
        input.notas || "",
        input.creadoPor,
        input.turnoCajaId || null,
      ]
    );

    return (await this.gasto(gastoId))!;
  }

  async guardarGasto(
    id: string,
    input: { fecha?: string; concepto?: string; categoria?: string; monto?: number; notas?: string }
  ): Promise<Gasto> {
    await this.executor.query(
      `
      UPDATE gastos SET
        fecha = COALESCE($1, fecha),
        concepto = COALESCE($2, concepto),
        categoria = COALESCE($3, categoria),
        monto = COALESCE($4, monto),
        notas = COALESCE($5, notas)
      WHERE id = $6;
    `,
      [input.fecha, input.concepto, input.categoria, input.monto, input.notas, id]
    );
    return (await this.gasto(id))!;
  }

  async borrarGasto(id: string): Promise<boolean> {
    await this.executor.query("DELETE FROM gastos WHERE id = $1;", [id]);
    return true;
  }
}
