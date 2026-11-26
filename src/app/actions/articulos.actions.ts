"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { DatosProducto, UnidadMedida } from "@/lib/types";
import { exigirSesion } from "@/lib/auth";
import { mensaje, conParam, refrescar } from "./helpers";

function articuloDe(formData: FormData): DatosProducto {
  return {
    codigo: String(formData.get("codigo") || ""),
    codigoBarras: formData.get("codigoBarras") ? String(formData.get("codigoBarras")).trim() : undefined,
    nombre: String(formData.get("nombre") || ""),
    marca: String(formData.get("marca") || "Genérica"),
    unidadMedida: String(formData.get("unidadMedida") || "UNIDAD") as UnidadMedida,
    inventarioInicial: Number(formData.get("inventarioInicial") || 0),
    precio: Number(formData.get("precio") || 0),
    costo: Number(formData.get("costo") || 0),
    categoria: String(formData.get("categoria") || "Otros"),
    stockMinimo: Number(formData.get("stockMinimo") || 0),
  };
}

export async function altaAction(formData: FormData) {
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    await api.alta(articuloDe(formData));
  } catch (error) {
    redirect(conParam("/inventario/nuevo", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/inventario", "aviso", "Artículo guardado."));
}

export async function editarArticuloAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    await api.editarArticulo(id, articuloDe(formData));
  } catch (error) {
    redirect(conParam(`/inventario/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/inventario/${id}`, "aviso", "Artículo actualizado."));
}

export async function borrarArticuloAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    await api.borrarArticulo(id);
  } catch (error) {
    redirect(conParam(`/inventario/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/inventario", "aviso", "Artículo eliminado."));
}

export async function activarArticuloAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const activo = formData.get("activo") === "true";
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    await api.activarArticulo(id, activo);
  } catch (error) {
    redirect(conParam("/inventario", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/inventario", "aviso", activo ? "Artículo activado exitosamente." : "Artículo desactivado exitosamente."));
}
