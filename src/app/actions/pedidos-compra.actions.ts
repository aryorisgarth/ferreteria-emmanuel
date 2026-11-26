"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { EstadoPedidoCompra, EstadoRecepcionCompra } from "@/lib/types";
import { exigirSesion } from "@/lib/auth";
import { usuario, mensaje, conParam, refrescar, ResultadoAccion } from "./helpers";
import { lineasCompraValidadas } from "./validaciones";

export async function crearPedidoCompraAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let id = "";
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    const items = await lineasCompraValidadas(formData);
    const itemsPedido = items.map((it) => ({
      productoId: it.productoId,
      cantidadPedida: it.cantidad,
      precioUnitario: it.precio,
      observacion: it.observacion,
    }));

    id = await api.altaPedido({
      proveedor: String(formData.get("proveedor") || ""),
      proveedorId: String(formData.get("proveedorId") || "") || null,
      fechaEmision: String(formData.get("fechaEmision") || formData.get("fecha") || ""),
      fechaEntregaEstimada: String(formData.get("fechaEntregaEstimada") || "") || undefined,
      notas: String(formData.get("notas") || ""),
      creadoPor: await usuario(),
      items: itemsPedido,
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(`/compras/pedidos/${id}`);
}

export async function cambiarEstadoPedidoAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const estado = String(formData.get("estado") || "") as EstadoPedidoCompra;
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    await api.cambiarEstadoPedido(id, estado);
  } catch (error) {
    redirect(conParam(`/compras/pedidos/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/compras/pedidos/${id}`, "aviso", `Estado del pedido actualizado a ${estado}.`));
}

export async function crearRecepcionCompraAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  let id = "";
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    const items = await lineasCompraValidadas(formData);
    const itemsRecepcion = items.map((it) => ({
      productoId: it.productoId,
      cantidadRecibida: it.cantidad,
      costoUnitario: it.precio,
      observacion: it.observacion,
    }));

    id = await api.altaRecepcion({
      pedidoId: String(formData.get("pedidoId") || "") || null,
      proveedor: String(formData.get("proveedor") || ""),
      proveedorId: String(formData.get("proveedorId") || "") || null,
      fecha: String(formData.get("fecha") || ""),
      remisionProveedor: String(formData.get("remisionProveedor") || ""),
      responsable: String(formData.get("responsable") || await usuario()),
      estadoConformidad: (String(formData.get("estadoConformidad") || "CONFORME") as EstadoRecepcionCompra),
      notas: String(formData.get("notas") || ""),
      items: itemsRecepcion,
    });
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(`/compras/recepciones/${id}`);
}
