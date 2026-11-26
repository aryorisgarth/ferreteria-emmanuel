"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { FormaPago } from "@/lib/types";
import { exigirSesion } from "@/lib/auth";
import { usuario, mensaje, conParam, refrescar, ResultadoAccion } from "./helpers";
import { lineasVentaValidadas } from "./validaciones";

export async function crearCotizacionAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let id = "";
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR", "CAJERO", "VENDEDOR"]);
    const items = await lineasVentaValidadas(formData, sesion.rol);
    const descuento = formData.get("descuento") ? Number(formData.get("descuento")) : undefined;
    const exenta = formData.get("exenta") === "true" || formData.get("exenta") === "1";
    id = await api.crearCotizacion({
      cliente: String(formData.get("cliente") || ""),
      clienteId: String(formData.get("clienteId") || "") || null,
      fecha: String(formData.get("fecha") || ""),
      fechaVencimiento: String(formData.get("fechaVencimiento") || "") || undefined,
      notas: String(formData.get("notas") || ""),
      condicionesComerciales: String(formData.get("condicionesComerciales") || "") || undefined,
      creadoPor: await usuario(),
      items,
      descuento,
      exenta,
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(`/cotizaciones/${id}`);
}

export async function editarCotizacionAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  const id = String(formData.get("id") || "");
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR", "CAJERO", "VENDEDOR"]);
    const items = await lineasVentaValidadas(formData, sesion.rol);
    const descuento = formData.get("descuento") ? Number(formData.get("descuento")) : undefined;
    const exenta = formData.get("exenta") === "true" || formData.get("exenta") === "1";
    await api.editarCotizacion(id, {
      cliente: String(formData.get("cliente") || ""),
      clienteId: String(formData.get("clienteId") || "") || null,
      fecha: String(formData.get("fecha") || ""),
      fechaVencimiento: String(formData.get("fechaVencimiento") || "") || undefined,
      notas: String(formData.get("notas") || ""),
      condicionesComerciales: String(formData.get("condicionesComerciales") || "") || undefined,
      items,
      descuento,
      exenta,
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(conParam(`/cotizaciones/${id}`, "aviso", "Cotización actualizada correctamente."));
}

export async function enviarCotizacionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO", "VENDEDOR"]);
    await api.marcarCotizacion(id, "ENVIADA");
  } catch (error) {
    redirect(conParam(`/cotizaciones/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/cotizaciones/${id}`, "aviso", "Cotización marcada como enviada."));
}

export async function aceptarCotizacionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO", "VENDEDOR"]);
    await api.marcarCotizacion(id, "ACEPTADA");
  } catch (error) {
    redirect(conParam(`/cotizaciones/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/cotizaciones/${id}`, "aviso", "El cliente aceptó la cotización. Todavía no mueve el inventario."));
}

export async function rechazarCotizacionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const motivo = String(formData.get("motivo") || "Rechazada por el cliente");
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO", "VENDEDOR"]);
    await api.marcarCotizacion(id, "RECHAZADA", motivo);
  } catch (error) {
    redirect(conParam(`/cotizaciones/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/cotizaciones/${id}`, "aviso", "Cotización marcada como rechazada."));
}

export async function vencerCotizacionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO", "VENDEDOR"]);
    await api.marcarCotizacion(id, "VENCIDA");
  } catch (error) {
    redirect(conParam(`/cotizaciones/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/cotizaciones/${id}`, "aviso", "Cotización marcada como vencida."));
}

export async function facturarCotizacionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const formaPago = (formData.get("formaPago") as FormaPago) || "EFECTIVO";
  const politicaPrecios = (formData.get("politicaPrecios") as "CONSERVAR" | "ACTUALIZAR") || "CONSERVAR";
  const montoRecibido = formData.get("recibido") ? Number(formData.get("recibido")) : undefined;
  let facturaId = "";
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO"]);
    facturaId = await api.convertirCotizacionAVenta({
      cotizacionId: id,
      creadoPor: await usuario(),
      fecha: String(formData.get("fecha") || ""),
      formaPago,
      politicaPrecios,
      montoRecibido,
    });
  } catch (error) {
    redirect(conParam(`/cotizaciones/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/facturas/${facturaId}`, "aviso", "Factura emitida desde cotización. Mercancía descargada del inventario."));
}

export async function borrarCotizacionAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    await api.borrarCotizacion(id);
  } catch (error) {
    redirect(conParam(`/cotizaciones/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/cotizaciones", "aviso", "Cotización eliminada."));
}
