import { paginar } from "@/lib/format";
import {
  buscarClientes,
  buscarProveedores,
  crearCliente,
  crearGasto,
  crearProveedor,
  desactivarCliente,
  desactivarProveedor,
  editarCliente,
  editarGasto,
  editarProveedor,
  eliminarCliente,
  eliminarGasto,
  eliminarProveedor,
  perfilCliente,
  perfilProveedor,
} from "@/lib/inventory/engine";
import { consultar, transaccion } from "@/lib/inventory/store";
import type { DatosPersona } from "@/lib/types";

// Clientes
export function clientes() {
  return consultar((db) => [...db.clientes].sort((a, b) => a.nombre.localeCompare(b.nombre)));
}

export function clientesPaginados(page: number = 1, q: string = "", limit: number = 20) {
  return consultar((db) => {
    const term = q.trim().toLowerCase();
    const filtrados = db.clientes.filter((c) => {
      if (!term) return true;
      return (
        c.nombre.toLowerCase().includes(term) ||
        (c.telefono && c.telefono.toLowerCase().includes(term)) ||
        (c.identificacion && c.identificacion.toLowerCase().includes(term)) ||
        (c.notas && c.notas.toLowerCase().includes(term)) ||
        (c.direccion && c.direccion.toLowerCase().includes(term))
      );
    });

    const ordenados = [...filtrados].sort((a, b) => a.nombre.localeCompare(b.nombre));
    const total = ordenados.length;
    const limitNum = Math.max(1, limit || 20);
    const pages = Math.max(1, Math.ceil(total / limitNum));
    const pageNum = Math.max(1, Math.min(page, pages));
    const offset = (pageNum - 1) * limitNum;
    const rows = ordenados.slice(offset, offset + limitNum);

    return { rows, items: rows, total, pages, totalPaginas: pages, page: pageNum, pagina: pageNum };
  });
}

export function buscarClientesLocal(q: string) {
  return consultar((db) => buscarClientes(db, q));
}

export function cliente(id: string) {
  return consultar((db) => db.clientes.find((c) => c.id === id) ?? null);
}

export function obtenerPerfilCliente(id: string) {
  return consultar((db) => perfilCliente(db, id));
}

export function altaCliente(input: DatosPersona) {
  return transaccion((db) => crearCliente(db, input).id);
}

export function guardarCliente(id: string, input: DatosPersona) {
  transaccion((db) => editarCliente(db, id, input));
}

export function desactivarClienteLocal(id: string, activo: boolean) {
  transaccion((db) => desactivarCliente(db, id, activo));
}

export function borrarCliente(id: string) {
  transaccion((db) => eliminarCliente(db, id));
}

// Proveedores
export function proveedores() {
  return consultar((db) => [...db.proveedores].sort((a, b) => a.nombre.localeCompare(b.nombre)));
}

export function buscarProveedoresLocal(q: string) {
  return consultar((db) => buscarProveedores(db, q));
}

export function proveedor(id: string) {
  return consultar((db) => db.proveedores.find((p) => p.id === id) ?? null);
}

export function obtenerPerfilProveedor(id: string) {
  return consultar((db) => perfilProveedor(db, id));
}

export function altaProveedor(input: DatosPersona) {
  return transaccion((db) => crearProveedor(db, input).id);
}

export function guardarProveedor(id: string, input: DatosPersona) {
  transaccion((db) => editarProveedor(db, id, input));
}

export function desactivarProveedorLocal(id: string, activo: boolean) {
  transaccion((db) => desactivarProveedor(db, id, activo));
}

export function borrarProveedor(id: string) {
  transaccion((db) => eliminarProveedor(db, id));
}

// Gastos
export function gastos(page: number) {
  return consultar((db) =>
    paginar([...db.gastos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.concepto.localeCompare(a.concepto)), page),
  );
}

export function todosLosGastos() {
  return consultar((db) => [...db.gastos].sort((a, b) => b.fecha.localeCompare(a.fecha)));
}

export function gasto(id: string) {
  return consultar((db) => db.gastos.find((g) => g.id === id) ?? null);
}

export function altaGasto(input: { fecha: string; concepto: string; categoria: string; monto: number; notas: string; creadoPor: string }) {
  return transaccion((db) => crearGasto(db, input).id);
}

export function guardarGasto(id: string, input: { fecha: string; concepto: string; categoria: string; monto: number; notas: string }) {
  transaccion((db) => editarGasto(db, id, input));
}

export function borrarGasto(id: string) {
  transaccion((db) => eliminarGasto(db, id));
}
