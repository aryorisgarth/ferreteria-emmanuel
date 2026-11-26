"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { FilaExcel, TipoAjusteInventario } from "@/lib/types";
import { ReglaBodegaError } from "@/lib/inventory/engine";
import { exigirSesion } from "@/lib/auth";
import { usuario, mensaje, conParam, refrescar, lineas, ResultadoAccion } from "./helpers";

export async function entradaAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    await api.entrada({
      productoId: String(formData.get("productoId") || ""),
      cantidad: Number(formData.get("cantidad")),
      fecha: String(formData.get("fecha") || ""),
      concepto: String(formData.get("concepto") || ""),
      usuario: await usuario(),
      esAuditoria: formData.get("esAuditoria") === "on",
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect("/movimientos?aviso=" + encodeURIComponent("Entrada anotada en el kárdex. El stock sumó esa cantidad."));
}

export async function directaAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let id = "";
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    id = await api.directa({
      oficinaId: String(formData.get("oficinaId") || ""),
      destinatario: String(formData.get("destinatario") || ""),
      fecha: String(formData.get("fecha") || ""),
      concepto: String(formData.get("concepto") || ""),
      usuario: await usuario(),
      esAuditoria: formData.get("esAuditoria") === "on",
      items: lineas(formData),
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(`/actas/${id}`);
}

export async function importarAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let n = 0;
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    const filas = JSON.parse(String(formData.get("filas") || "[]")) as FilaExcel[];
    if (!Array.isArray(filas)) throw new ReglaBodegaError("El archivo no trae renglones.");
    n = await api.importar(filas, await usuario());
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect("/kardex?aviso=" + encodeURIComponent(`${n} renglones de Excel quedaron registrados en el kárdex.`));
}

export async function editarAction(_previo: ResultadoAccion, _formData: FormData): Promise<ResultadoAccion> {
  return {
    ok: false,
    error: "Operación rechazada: El Kárdex es un registro histórico inmutable para consulta y auditoría contable. Las cantidades, fechas y referencias históricas no pueden ser modificadas directamente. Cualquier ajuste físico debe realizarse a través del submódulo de Ajustes de Inventario.",
  };
}

export async function crearAjusteInventarioAction(formData: FormData) {
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    const productoId = String(formData.get("productoId") || "").trim();
    const tipo = String(formData.get("tipo") || "SOBRANTE") as TipoAjusteInventario;
    const cantidad = Number(formData.get("cantidad") || 0);
    const motivo = String(formData.get("motivo") || "").trim();
    const fecha = String(formData.get("fecha") || new Date().toISOString().slice(0, 10));
    const costoReferencia = formData.get("costoReferencia") ? Number(formData.get("costoReferencia")) : undefined;
    const signo = formData.get("signo") ? (Number(formData.get("signo")) as 1 | -1) : undefined;

    await api.registrarAjuste({
      productoId,
      tipo,
      cantidad,
      motivo,
      fecha,
      usuario: sesion.usuario,
      costoReferencia,
      signo,
    });
  } catch (error) {
    redirect(conParam("/inventario?tab=ajustes", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/inventario?tab=ajustes", "aviso", "Ajuste de inventario registrado exitosamente."));
}

export async function crearConteoFisicoAction(formData: FormData) {
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    const fecha = String(formData.get("fecha") || new Date().toISOString().slice(0, 10));
    const notas = String(formData.get("notas") || "").trim();
    const itemsRaw = JSON.parse(String(formData.get("items") || "[]"));

    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      throw new ReglaBodegaError("El conteo debe incluir al menos un artículo.");
    }

    const items = itemsRaw.map((it: any) => ({
      productoId: String(it.productoId || ""),
      conteoFisico: Number(it.conteoFisico ?? 0),
      observacion: it.observacion ? String(it.observacion).trim() : undefined,
    }));

    await api.registrarConteo({
      fecha,
      notas,
      usuario: sesion.usuario,
      items,
    });
  } catch (error) {
    redirect(conParam("/inventario?tab=conteos", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/inventario?tab=conteos", "aviso", "Borrador de conteo físico guardado exitosamente."));
}

export async function aplicarConteoFisicoAction(formData: FormData) {
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR"]);
    const conteoId = String(formData.get("conteoId") || "");
    if (!conteoId) throw new ReglaBodegaError("ID de conteo requerido.");

    await api.aplicarConteo(conteoId, sesion.usuario);
  } catch (error) {
    redirect(conParam("/inventario?tab=conteos", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/inventario?tab=conteos", "aviso", "Conteo físico aplicado: existencias y kárdex actualizados."));
}
