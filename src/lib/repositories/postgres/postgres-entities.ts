import type { Cliente, Proveedor, Oficina, DatosPersona, Pagina } from "@/lib/types";
import type { SqlExecutor } from "./client";

export class PostgresEntitiesService {
  constructor(private executor: SqlExecutor) {}

  // --- OFICINAS / DEPENDENCIAS ---
  async oficinas(): Promise<Oficina[]> {
    const res = await this.executor.query(`
      SELECT id, nombre, tipo
      FROM oficinas
      ORDER BY nombre ASC;
    `);
    return res.rows as Oficina[];
  }

  // --- CLIENTES ---
  async clientes(page: number = 1, q: string = "", limit: number = 20): Promise<Pagina<Cliente>> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const offset = (pageNum - 1) * limitNum;
    const busqueda = `%${q.trim().toLowerCase()}%`;

    const countRes = await this.executor.query(
      `
      SELECT COUNT(*) as total
      FROM clientes
      WHERE LOWER(nombre) LIKE $1 OR LOWER(COALESCE(identificacion, '')) LIKE $1 OR LOWER(telefono) LIKE $1;
    `,
      [busqueda]
    );

    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limitNum));

    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, nombre, telefono, direccion, notas, identificacion, email, tipo,
        contacto, dias_credito as "diasCredito", limite_credito::float as "limiteCredito",
        saldo_pendiente::float as "saldoPendiente", activo
      FROM clientes
      WHERE LOWER(nombre) LIKE $1 OR LOWER(COALESCE(identificacion, '')) LIKE $1 OR LOWER(telefono) LIKE $1
      ORDER BY nombre ASC
      LIMIT $2 OFFSET $3;
    `,
      [busqueda, limitNum, offset]
    );

    return {
      rows: rowsRes.rows as Cliente[],
      page: pageNum,
      pages,
      total,
    };
  }

  async cliente(id: string): Promise<Cliente | null> {
    const res = await this.executor.query(
      `
      SELECT 
        id, nombre, telefono, direccion, notas, identificacion, email, tipo,
        contacto, dias_credito as "diasCredito", limite_credito::float as "limiteCredito",
        saldo_pendiente::float as "saldoPendiente", activo
      FROM clientes
      WHERE id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0] as Cliente;
  }

  async perfilCliente(id: string) {
    const c = await this.cliente(id);
    if (!c) throw new Error("Cliente no encontrado");

    // Historial de facturas
    const factsRes = await this.executor.query(
      `
      SELECT 
        id, numero, fecha, total::float, estado, forma_pago as "formaPago"
      FROM facturas
      WHERE cliente_id = $1
      ORDER BY fecha DESC
      LIMIT 50;
    `,
      [id]
    );

    // Métricas
    const sumRes = await this.executor.query(
      `
      SELECT 
        COALESCE(SUM(total), 0)::float as "totalComprado",
        COUNT(id) as "totalFacturas",
        MAX(fecha) as "ultimaCompra"
      FROM facturas
      WHERE cliente_id = $1 AND anulada = false;
    `,
      [id]
    );

    return {
      cliente: c,
      facturas: factsRes.rows,
      totalComprado: sumRes.rows[0]?.totalComprado || 0,
      totalFacturas: parseInt(sumRes.rows[0]?.totalFacturas || "0", 10),
      ultimaCompra: sumRes.rows[0]?.ultimaCompra || null,
      saldoPendiente: c.saldoPendiente || 0,
    };
  }

  async altaCliente(datos: DatosPersona): Promise<Cliente> {
    const id = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await this.executor.query(
      `
      INSERT INTO clientes (
        id, nombre, telefono, direccion, notas, identificacion, email, tipo, contacto,
        dias_credito, limite_credito, saldo_pendiente, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0.00, true);
    `,
      [
        id,
        datos.nombre.trim(),
        datos.telefono ? datos.telefono.trim() : "",
        datos.direccion ? datos.direccion.trim() : "",
        datos.notas ? datos.notas.trim() : "",
        datos.identificacion ? datos.identificacion.trim() : null,
        datos.email ? datos.email.trim() : null,
        datos.tipo || "PARTICULAR",
        datos.contacto ? datos.contacto.trim() : null,
        datos.diasCredito || 0,
        datos.limiteCredito || 0,
      ]
    );
    return (await this.cliente(id))!;
  }

  async guardarCliente(id: string, datos: DatosPersona): Promise<Cliente> {
    await this.executor.query(
      `
      UPDATE clientes SET
        nombre = $1,
        telefono = $2,
        direccion = $3,
        notas = $4,
        identificacion = $5,
        email = $6,
        tipo = $7,
        contacto = $8,
        dias_credito = $9,
        limite_credito = $10,
        activo = COALESCE($11, activo),
        actualizado_en = NOW()
      WHERE id = $12;
    `,
      [
        datos.nombre.trim(),
        datos.telefono ? datos.telefono.trim() : "",
        datos.direccion ? datos.direccion.trim() : "",
        datos.notas ? datos.notas.trim() : "",
        datos.identificacion ? datos.identificacion.trim() : null,
        datos.email ? datos.email.trim() : null,
        datos.tipo || "PARTICULAR",
        datos.contacto ? datos.contacto.trim() : null,
        datos.diasCredito || 0,
        datos.limiteCredito || 0,
        datos.activo,
        id,
      ]
    );
    return (await this.cliente(id))!;
  }

  async desactivarCliente(id: string): Promise<Cliente> {
    await this.executor.query("UPDATE clientes SET activo = false, actualizado_en = NOW() WHERE id = $1;", [id]);
    return (await this.cliente(id))!;
  }

  async buscarClientes(q: string): Promise<Cliente[]> {
    const res = await this.clientes(1, q);
    return res.rows;
  }

  async borrarCliente(id: string): Promise<boolean> {
    // Si tiene facturas, desactivar en lugar de borrar físicamente
    const fRes = await this.executor.query("SELECT id FROM facturas WHERE cliente_id = $1 LIMIT 1;", [id]);
    if (fRes.rows.length > 0) {
      await this.desactivarCliente(id);
      return true;
    }
    await this.executor.query("DELETE FROM clientes WHERE id = $1;", [id]);
    return true;
  }

  // --- PROVEEDORES ---
  async proveedores(page: number = 1, q: string = ""): Promise<Pagina<Proveedor>> {
    const limit = 20;
    const offset = Math.max(0, (page - 1) * limit);
    const busqueda = `%${q.trim().toLowerCase()}%`;

    const countRes = await this.executor.query(
      `
      SELECT COUNT(*) as total
      FROM proveedores
      WHERE LOWER(nombre) LIKE $1 OR LOWER(COALESCE(identificacion, '')) LIKE $1 OR LOWER(telefono) LIKE $1;
    `,
      [busqueda]
    );

    const total = parseInt(countRes.rows[0]?.total || "0", 10);
    const pages = Math.max(1, Math.ceil(total / limit));

    const rowsRes = await this.executor.query(
      `
      SELECT 
        id, nombre, telefono, direccion, notas, identificacion, email, tipo,
        contacto, dias_credito as "diasCredito", limite_credito::float as "limiteCredito",
        saldo_pendiente::float as "saldoPendiente", activo
      FROM proveedores
      WHERE LOWER(nombre) LIKE $1 OR LOWER(COALESCE(identificacion, '')) LIKE $1 OR LOWER(telefono) LIKE $1
      ORDER BY nombre ASC
      LIMIT $2 OFFSET $3;
    `,
      [busqueda, limit, offset]
    );

    return {
      rows: rowsRes.rows as Proveedor[],
      page,
      pages,
      total,
    };
  }

  async proveedor(id: string): Promise<Proveedor | null> {
    const res = await this.executor.query(
      `
      SELECT 
        id, nombre, telefono, direccion, notas, identificacion, email, tipo,
        contacto, dias_credito as "diasCredito", limite_credito::float as "limiteCredito",
        saldo_pendiente::float as "saldoPendiente", activo
      FROM proveedores
      WHERE id = $1
      LIMIT 1;
    `,
      [id]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0] as Proveedor;
  }

  async perfilProveedor(id: string) {
    const p = await this.proveedor(id);
    if (!p) throw new Error("Proveedor no encontrado");

    const cmpRes = await this.executor.query(
      `
      SELECT 
        id, numero, fecha, total::float, saldo_pendiente::float as "saldoPendiente", estado_pago as "estadoPago"
      FROM compras
      WHERE proveedor_id = $1
      ORDER BY fecha DESC
      LIMIT 50;
    `,
      [id]
    );

    const sumRes = await this.executor.query(
      `
      SELECT 
        COALESCE(SUM(total), 0)::float as "totalComprado",
        COALESCE(SUM(saldo_pendiente), 0)::float as "saldoTotalPendiente",
        COUNT(id) as "totalCompras"
      FROM compras
      WHERE proveedor_id = $1 AND anulada = false;
    `,
      [id]
    );

    return {
      proveedor: p,
      compras: cmpRes.rows,
      totalComprado: sumRes.rows[0]?.totalComprado || 0,
      saldoTotalPendiente: sumRes.rows[0]?.saldoTotalPendiente || 0,
      totalCompras: parseInt(sumRes.rows[0]?.totalCompras || "0", 10),
    };
  }

  async altaProveedor(datos: DatosPersona): Promise<Proveedor> {
    const id = `prov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await this.executor.query(
      `
      INSERT INTO proveedores (
        id, nombre, telefono, direccion, notas, identificacion, email, tipo, contacto,
        dias_credito, limite_credito, saldo_pendiente, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0.00, true);
    `,
      [
        id,
        datos.nombre.trim(),
        datos.telefono ? datos.telefono.trim() : "",
        datos.direccion ? datos.direccion.trim() : "",
        datos.notas ? datos.notas.trim() : "",
        datos.identificacion ? datos.identificacion.trim() : null,
        datos.email ? datos.email.trim() : null,
        datos.tipo || "EMPRESA",
        datos.contacto ? datos.contacto.trim() : null,
        datos.diasCredito || 0,
        datos.limiteCredito || 0,
      ]
    );
    return (await this.proveedor(id))!;
  }

  async guardarProveedor(id: string, datos: DatosPersona): Promise<Proveedor> {
    await this.executor.query(
      `
      UPDATE proveedores SET
        nombre = $1,
        telefono = $2,
        direccion = $3,
        notas = $4,
        identificacion = $5,
        email = $6,
        tipo = $7,
        contacto = $8,
        dias_credito = $9,
        limite_credito = $10,
        activo = COALESCE($11, activo),
        actualizado_en = NOW()
      WHERE id = $12;
    `,
      [
        datos.nombre.trim(),
        datos.telefono ? datos.telefono.trim() : "",
        datos.direccion ? datos.direccion.trim() : "",
        datos.notas ? datos.notas.trim() : "",
        datos.identificacion ? datos.identificacion.trim() : null,
        datos.email ? datos.email.trim() : null,
        datos.tipo || "EMPRESA",
        datos.contacto ? datos.contacto.trim() : null,
        datos.diasCredito || 0,
        datos.limiteCredito || 0,
        datos.activo,
        id,
      ]
    );
    return (await this.proveedor(id))!;
  }

  async desactivarProveedor(id: string): Promise<Proveedor> {
    await this.executor.query("UPDATE proveedores SET activo = false, actualizado_en = NOW() WHERE id = $1;", [id]);
    return (await this.proveedor(id))!;
  }

  async buscarProveedores(q: string): Promise<Proveedor[]> {
    const res = await this.proveedores(1, q);
    return res.rows;
  }

  async borrarProveedor(id: string): Promise<boolean> {
    const cRes = await this.executor.query("SELECT id FROM compras WHERE proveedor_id = $1 LIMIT 1;", [id]);
    if (cRes.rows.length > 0) {
      await this.desactivarProveedor(id);
      return true;
    }
    await this.executor.query("DELETE FROM proveedores WHERE id = $1;", [id]);
    return true;
  }
}
