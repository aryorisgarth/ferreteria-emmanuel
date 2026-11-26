"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { exigirSesion } from "@/lib/auth";
import { usuario, mensaje, conParam, refrescar, ResultadoAccion } from "./helpers";

function personaDe(formData: FormData) {
  const activoVal = formData.get("activo");
  return {
    nombre: String(formData.get("nombre") || ""),
    telefono: String(formData.get("telefono") || ""),
    direccion: String(formData.get("direccion") || ""),
    notas: String(formData.get("notas") || ""),
    identificacion: String(formData.get("identificacion") || formData.get("ruc") || "").trim() || undefined,
    email: String(formData.get("email") || "").trim() || undefined,
    tipo: (formData.get("tipo") as "PARTICULAR" | "EMPRESA") || undefined,
    contacto: String(formData.get("contacto") || "").trim() || undefined,
    diasCredito: formData.get("diasCredito") ? Number(formData.get("diasCredito")) : undefined,
    limiteCredito: formData.get("limiteCredito") ? Number(formData.get("limiteCredito")) : undefined,
    activo: activoVal !== null ? (activoVal === "true" || activoVal === "1" || activoVal === "on") : undefined,
  };
}

export async function guardarClienteAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO", "VENDEDOR"]);
    if (id) await api.guardarCliente(id, personaDe(formData));
    else {
      const nuevo = await api.altaCliente(personaDe(formData));
      refrescar();
      redirect(`/clientes/${nuevo}`);
    }
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(conParam(`/clientes/${id}`, "aviso", "Cliente actualizado."));
}

export async function borrarClienteAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    await api.borrarCliente(id);
  } catch (error) {
    redirect(conParam(`/clientes/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/clientes", "aviso", "Cliente eliminado."));
}

export async function desactivarClienteAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const activo = formData.get("activo") === "true" || formData.get("activo") === "1";
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO"]);
    await api.desactivarCliente(id, activo);
  } catch (error) {
    redirect(conParam(`/clientes/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/clientes/${id}`, "aviso", `Cliente ${activo ? "activado" : "desactivado"} correctamente.`));
}

export async function guardarProveedorAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    if (id) await api.guardarProveedor(id, personaDe(formData));
    else {
      const nuevo = await api.altaProveedor(personaDe(formData));
      refrescar();
      redirect(`/proveedores/${nuevo}`);
    }
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(conParam(`/proveedores/${id}`, "aviso", "Proveedor actualizado."));
}

export async function borrarProveedorAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    await api.borrarProveedor(id);
  } catch (error) {
    redirect(conParam(`/proveedores/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/proveedores", "aviso", "Proveedor eliminado."));
}

export async function desactivarProveedorAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const activo = formData.get("activo") === "true" || formData.get("activo") === "1";
  try {
    await exigirSesion(["ADMINISTRADOR", "BODEGUERO"]);
    await api.desactivarProveedor(id, activo);
  } catch (error) {
    redirect(conParam(`/proveedores/${id}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/proveedores/${id}`, "aviso", `Proveedor ${activo ? "activado" : "desactivado"} correctamente.`));
}

export async function guardarGastoAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    const payload = {
      fecha: String(formData.get("fecha") || ""),
      concepto: String(formData.get("concepto") || ""),
      categoria: String(formData.get("categoria") || "General"),
      monto: Number(formData.get("monto") || 0),
      notas: String(formData.get("notas") || ""),
    };
    if (id) await api.guardarGasto(id, payload);
    else {
      await api.altaGasto({ ...payload, creadoPor: await usuario() });
      refrescar();
      redirect(conParam("/gastos", "aviso", "Gasto registrado."));
    }
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
  refrescar();
  redirect(conParam("/gastos", "aviso", "Gasto actualizado."));
}

export async function borrarGastoAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    await api.borrarGasto(id);
  } catch (error) {
    redirect(conParam("/gastos", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/gastos", "aviso", "Gasto eliminado."));
}
