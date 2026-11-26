"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { FormaPago } from "@/lib/types";
import { exigirSesion } from "@/lib/auth";
import { usuario, mensaje, conParam, refrescar, ResultadoAccion } from "./helpers";
import { lineasCompraValidadas } from "./validaciones";

export async function crearCompraAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let id = "";
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    const items = await lineasCompraValidadas(formData);

    id = await api.altaCompra({
      proveedor: String(formData.get("proveedor") || ""),
      proveedorId: String(formData.get("proveedorId") || "") || null,
      fecha: String(formData.get("fecha") || ""),
      notas: String(formData.get("notas") || ""),
      creadoPor: await usuario(),
      facturaProveedor: String(formData.get("facturaProveedor") || ""),
      condicionPago: (String(formData.get("condicionPago") || "CONTADO") as any),
      formaPago: (String(formData.get("formaPago") || "EFECTIVO") as FormaPago),
      diasCredito: formData.get("diasCredito") ? Number(formData.get("diasCredito")) : undefined,
      fechaVencimiento: String(formData.get("fechaVencimiento") || "") || undefined,
      recepcionId: String(formData.get("recepcionId") || "") || null,
      pedidoId: String(formData.get("pedidoId") || "") || null,
      descuento: formData.get("descuento") ? Number(formData.get("descuento")) : undefined,
      iva: formData.get("iva") !== null && formData.get("iva") !== "" ? Number(formData.get("iva")) : formData.get("isv") ? Number(formData.get("isv")) : undefined,
      isv: formData.get("iva") !== null && formData.get("iva") !== "" ? Number(formData.get("iva")) : formData.get("isv") ? Number(formData.get("isv")) : undefined,
      items,
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(`/compras/${id}`);
}

export async function anularCompraAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    await api.anularCompra(id, await usuario());
  } catch (error) {
    redirect(conParam(`/compras/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/compras/${id}`, "aviso", "Compra anulada. El stock se revirtió."));
}

export async function crearAbonoCompraAction(formData: FormData) {
  const compraId = String(formData.get("compraId") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO"]);
    await api.altaAbonoCompra({
      compraId,
      fecha: String(formData.get("fecha") || ""),
      monto: Number(formData.get("monto") || 0),
      formaPago: (String(formData.get("formaPago") || "EFECTIVO") as FormaPago),
      referencia: String(formData.get("referencia") || ""),
      notas: String(formData.get("notas") || ""),
      creadoPor: await usuario(),
    });
  } catch (error) {
    redirect(conParam(`/compras/${compraId}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/compras/${compraId}`, "aviso", "Abono registrado exitosamente."));
}

export async function crearDevolucionProveedorAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let id = "";
  const compraId = String(formData.get("compraId") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    const items = await lineasCompraValidadas(formData);
    const itemsDevolucion = items.map((it) => ({
      productoId: it.productoId,
      cantidad: it.cantidad,
      observacion: it.observacion,
    }));

    id = await api.altaDevolucionProveedor({
      compraId,
      fecha: String(formData.get("fecha") || ""),
      motivo: String(formData.get("motivo") || ""),
      notaCreditoProveedor: String(formData.get("notaCreditoProveedor") || ""),
      creadoPor: await usuario(),
      items: itemsDevolucion,
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(`/compras/devoluciones/${id}`);
}
