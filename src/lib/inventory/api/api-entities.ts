import * as local from "@/lib/inventory/local";
import { getStorageProvider } from "@/lib/repositories";
import type { DatosPersona } from "@/lib/types";
import { getRepo } from "./api-core";

// --- CLIENTES ---
export async function clientes(page?: number, q: string = "") {
  if (page === undefined) {
    if (getStorageProvider() === "postgres") {
      const res = await (getRepo() as any).clientes(1, q, 500);
      return res?.rows ?? [];
    }
    return local.clientes();
  }
  const res = await (getRepo() as any).clientes(page, q);
  return Array.isArray(res) ? res : (res?.rows ?? []);
}

export async function clientesPaginados(page: number = 1, q: string = "", limit: number = 20) {
  if (getStorageProvider() === "postgres") {
    return (getRepo() as any).clientes(page, q, limit);
  }
  return local.clientesPaginados(page, q, limit);
}

export async function cliente(id: string) {
  return getRepo().cliente(id);
}

export async function perfilCliente(id: string) {
  return (getRepo() as any).perfilCliente(id);
}

export async function altaCliente(input: DatosPersona) {
  return getRepo().altaCliente(input);
}

export async function guardarCliente(id: string, input: DatosPersona) {
  return getRepo().guardarCliente(id, input);
}

export async function desactivarCliente(id: string, activo: boolean) {
  if (activo) {
    return (getRepo() as any).guardarCliente(id, { activo: true });
  }
  return getRepo().desactivarCliente(id);
}

export async function buscarClientes(q: string) {
  return getRepo().buscarClientes(q);
}

export async function borrarCliente(id: string) {
  return getRepo().borrarCliente(id);
}

// --- PROVEEDORES ---
export async function proveedores(page: number = 1, q: string = "") {
  const res = await (getRepo() as any).proveedores(page, q);
  return Array.isArray(res) ? res : (res?.rows ?? []);
}

export async function proveedor(id: string) {
  return getRepo().proveedor(id);
}

export async function perfilProveedor(id: string) {
  return (getRepo() as any).perfilProveedor(id);
}

export async function altaProveedor(input: DatosPersona) {
  return getRepo().altaProveedor(input);
}

export async function guardarProveedor(id: string, input: DatosPersona) {
  return getRepo().guardarProveedor(id, input);
}

export async function desactivarProveedor(id: string, activo: boolean) {
  if (activo) {
    return (getRepo() as any).guardarProveedor(id, { activo: true });
  }
  return getRepo().desactivarProveedor(id);
}

export async function buscarProveedores(q: string) {
  return getRepo().buscarProveedores(q);
}

export async function borrarProveedor(id: string) {
  return getRepo().borrarProveedor(id);
}

// --- GASTOS OPERATIVOS ---
export async function gastos(page: number = 1) {
  return getRepo().gastos(page);
}

export async function todosLosGastos() {
  return getRepo().todosLosGastos();
}

export async function gasto(id: string) {
  return getRepo().gasto(id);
}

export async function altaGasto(input: any) {
  return getRepo().altaGasto(input);
}

export async function guardarGasto(id: string, input: any) {
  return getRepo().guardarGasto(id, input);
}

export async function borrarGasto(id: string) {
  return getRepo().borrarGasto(id);
}
