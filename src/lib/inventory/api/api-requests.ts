import * as remoto from "@/lib/inventory/supabase-bodega";
import type { EstadoSolicitud, LineaCaptura } from "@/lib/types";
import { conexion, getRepo } from "./api-core";

export async function oficinas() {
  const sb = conexion();
  if (sb) return remoto.oficinas(sb);
  return getRepo().oficinas();
}

export async function solicitudes(page: number = 1, estado?: EstadoSolicitud) {
  const sb = conexion();
  if (sb) return remoto.solicitudes(sb, page, estado);
  return getRepo().solicitudes(page, estado);
}

export async function solicitud(id: string) {
  const sb = conexion();
  if (sb) return remoto.solicitud(sb, id);
  return getRepo().solicitud(id);
}

export async function crear(input: {
  solicitante: string;
  oficinaId: string;
  destinatario: string;
  observaciones: string;
  fecha: string;
  creadoPor: string;
  items: LineaCaptura[];
}) {
  const sb = conexion();
  if (sb) return remoto.crear(sb, input);
  return getRepo().crear(input);
}

export async function aprobar(id: string, usuario: string) {
  const sb = conexion();
  if (sb) return remoto.aprobar(sb, id, usuario);
  return getRepo().aprobar(id, usuario);
}

export async function entregar(id: string, usuario: string) {
  const sb = conexion();
  if (sb) return remoto.entregar(sb, id, usuario);
  return getRepo().entregar(id, usuario);
}

export async function actas(page: number = 1) {
  const sb = conexion();
  if (sb) return remoto.actas(sb, page);
  return getRepo().actas(page);
}

export async function acta(id: string) {
  const sb = conexion();
  if (sb) return remoto.acta(sb, id);
  return getRepo().acta(id);
}
