"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { ReglaBodegaError } from "@/lib/inventory/engine";
import type { FormaPago, OrigenFactura } from "@/lib/types";
import { exigirSesion } from "@/lib/auth";
import { conParam, mensaje, refrescar, usuario, type ResultadoAccion } from "./helpers";
import { lineasVentaValidadas } from "./validaciones";

export async function crearFacturaAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let id = "";
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR", "CAJERO"]);
    const items = await lineasVentaValidadas(formData, sesion.rol);
    const cotizacionId = String(formData.get("cotizacionId") || "").trim() || undefined;
    id = await api.emitirFactura({
      cliente: String(formData.get("cliente") || "Público general"),
      clienteId: String(formData.get("clienteId") || "") || null,
      cotizacionId,
      fecha: String(formData.get("fecha") || ""),
      notas: String(formData.get("notas") || ""),
      creadoPor: await usuario(),
      formaPago: String(formData.get("formaPago") || "EFECTIVO") as FormaPago,
      origen: cotizacionId ? "COTIZACION" : ((String(formData.get("origen") || "DIRECTA") || "DIRECTA") as OrigenFactura),
      items,
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(`/facturas/${id}`);
}

export async function pagarFacturaAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    await api.pagarFactura(id);
  } catch (error) {
    redirect(conParam(`/facturas/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/facturas/${id}`, "aviso", "Factura marcada como pagada. El inventario no cambia."));
}

export async function verificarTransferenciaAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const monto = formData.get("montoAcreditado") ? Number(formData.get("montoAcreditado")) : undefined;
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR"]);
    await api.verificarTransferencia(id, sesion.usuario, monto);
  } catch (error) {
    redirect(conParam("/cobranza", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/cobranza", "aviso", "Transferencia verificada y acreditada exitosamente. Factura liquidada."));
}

export async function rechazarTransferenciaAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const motivo = String(formData.get("motivo") || "Rechazado por verificación bancaria");
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR"]);
    await api.rechazarTransferencia(id, sesion.usuario, motivo);
  } catch (error) {
    redirect(conParam("/cobranza", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/cobranza", "aviso", "Transferencia bancaria marcada como rechazada."));
}

export async function anularFacturaAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    await api.anularFactura(id, await usuario());
  } catch (error) {
    redirect(conParam(`/facturas/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/facturas/${id}`, "aviso", "Factura anulada. El stock volvió al inventario."));
}

export async function registrarDevolucionClienteAction(formData: FormData) {
  const facturaId = String(formData.get("facturaId") || "");
  const motivo = String(formData.get("motivo") || "");
  const metodoReintegro = (String(formData.get("metodoReintegro") || "EFECTIVO") as "EFECTIVO" | "NOTA_CREDITO");
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO"]);
    let items: Array<{ productoId: string; cantidad: number; observacion?: string }> = [];
    try {
      const crudo = JSON.parse(String(formData.get("items") || "[]"));
      if (Array.isArray(crudo)) items = crudo;
    } catch {
      throw new ReglaBodegaError("Formato de renglones a devolver inválido.");
    }
    await api.registrarDevolucionCliente({
      facturaId,
      items,
      motivo,
      responsable: await usuario(),
      fecha: String(formData.get("fecha") || "") || undefined,
      metodoReintegro,
    });
  } catch (error) {
    redirect(conParam(`/facturas/${facturaId}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/facturas/${facturaId}`, "aviso", "Devolución procesada correctamente y mercancía reintegrada al almacén."));
}
