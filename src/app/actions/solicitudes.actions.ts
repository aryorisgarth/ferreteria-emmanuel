"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { exigirSesion } from "@/lib/auth";
import { usuario, mensaje, conParam, refrescar, lineas, ResultadoAccion } from "./helpers";

export async function crearSolicitudAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let id = "";
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO", "VENDEDOR"]);
    id = await api.crear({
      solicitante: String(formData.get("solicitante") || ""),
      oficinaId: String(formData.get("oficinaId") || ""),
      destinatario: String(formData.get("destinatario") || ""),
      observaciones: String(formData.get("observaciones") || ""),
      fecha: String(formData.get("fecha") || ""),
      creadoPor: await usuario(),
      items: lineas(formData),
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(`/solicitudes/${id}`);
}

export async function aprobarAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    await api.aprobar(id, await usuario());
  } catch (error) {
    redirect(conParam(`/solicitudes/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/solicitudes/${id}`, "aviso", "Acta emitida. El inventario todavía no se descuenta."));
}

export async function entregarAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const volver = String(formData.get("volver") || `/solicitudes/${id}`);
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    await api.entregar(id, await usuario());
  } catch (error) {
    redirect(conParam(volver, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(volver, "aviso", "Descargo registrado en el kárdex. El stock quedó actualizado."));
}
