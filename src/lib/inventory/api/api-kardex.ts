import type { FiltroKardex } from "@/lib/inventory/modelos";
import * as remoto from "@/lib/inventory/supabase-bodega";
import type { EstadoAuditoria, LineaCaptura } from "@/lib/types";
import { conexion, getRepo } from "./api-core";

export async function entrada(input: {
  productoId: string;
  cantidad: number;
  fecha: string;
  concepto: string;
  usuario: string;
  esAuditoria: boolean;
}) {
  const sb = conexion();
  if (sb) return remoto.entrada(sb, input);
  return getRepo().entrada(input);
}

export async function directa(input: {
  oficinaId: string;
  destinatario: string;
  fecha: string;
  concepto: string;
  usuario: string;
  esAuditoria: boolean;
  items: LineaCaptura[];
}) {
  const sb = conexion();
  if (sb) return remoto.directa(sb, input);
  return getRepo().directa(input);
}

export async function kardex(filtro: FiltroKardex) {
  const sb = conexion();
  if (sb) return remoto.kardex(sb, filtro);
  return getRepo().kardex(filtro);
}

export async function movimiento(id: string) {
  const sb = conexion();
  if (sb) return remoto.movimiento(sb, id);
  return getRepo().movimiento(id);
}

export async function editar(
  id: string,
  input: {
    cantidad?: number;
    fecha?: string;
    concepto?: string;
    destinatario?: string;
    oficinaId?: string | null;
    esAuditoria?: boolean;
    estadoAuditoria?: EstadoAuditoria;
    usuario?: string;
    observacion?: string;
  }
) {
  const sb = conexion();
  if (sb) return (remoto as any).editar(sb, id, input);
  return (getRepo() as any).editar(id, input);
}

export async function total(fecha: string = "", page: number = 1) {
  const sb = conexion();
  if (sb) return (remoto as any).total(sb, fecha, page);
  return (getRepo() as any).total(fecha, page);
}
