"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  autenticar,
  crearSesion,
  destruirSesion,
  solicitarRestablecimiento,
  exigirSesion,
  crearOActualizarUsuarioCuenta,
  eliminarUsuarioCuenta,
  type RolUsuario,
} from "@/lib/auth";
import { conParam, mensaje, refrescar, type ResultadoAccion } from "./helpers";

export async function loginAction(_previo: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  try {
    const usuarioInput = String(formData.get("usuario") || "").trim();
    const clave = String(formData.get("clave") || "");
    const recordar = formData.get("recordar") === "on";
    const volver = String(formData.get("volver") || "/inicio");

    const res = await autenticar(usuarioInput, clave);
    if (!res.ok) {
      return { ok: false, error: res.error };
    }

    await crearSesion(res.usuario, recordar);
    refrescar();
    if (res.usuario.debeCambiarClave) {
      redirect("/cambiar-clave-obligatoria");
    }
    redirect(volver);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { ok: false, error: mensaje(err) };
  }
}

export async function ingresar(formData: FormData) {
  try {
    const usuarioInput = String(formData.get("usuario") || "").trim();
    const clave = String(formData.get("clave") || "");
    const recordar = formData.get("recordar") === "on";
    const volver = String(formData.get("volver") || "/inicio");

    const res = await autenticar(usuarioInput, clave);
    if (!res.ok) {
      redirect(conParam("/", "error", res.error));
    }

    await crearSesion(res.usuario, recordar);
    refrescar();
    if (res.usuario.debeCambiarClave) {
      redirect("/cambiar-clave-obligatoria");
    }
    redirect(volver);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    redirect(conParam("/", "error", mensaje(err)));
  }
}

export async function solicitarRecuperacionAction(
  _previo: { ok: boolean; mensaje?: string; error?: string } | null,
  formData: FormData,
) {
  const usuarioOEmail = String(formData.get("usuarioOEmail") || "");
  return solicitarRestablecimiento(usuarioOEmail);
}

export async function salir() {
  await destruirSesion();
  refrescar();
  redirect("/");
}

export async function guardarUsuarioAction(formData: FormData) {
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    const { obtenerConfiguracion, guardarConfiguracion } = await import("@/lib/config");
    const actual = await obtenerConfiguracion();
    const id = String(formData.get("id") || "");
    const user = String(formData.get("usuario") || "").trim().toLowerCase();
    const nombre = String(formData.get("nombre") || "").trim();
    const rol = String(formData.get("rol") || "CAJERO") as RolUsuario;
    const clave = String(formData.get("clave") || "");

    if (!user || !nombre) {
      throw new Error("El nombre y usuario son obligatorios.");
    }

    const cuenta = await crearOActualizarUsuarioCuenta({
      id: id || undefined,
      usuario: user,
      nombre,
      rol,
      clave: clave ? clave : undefined,
    });

    if (id) {
      actual.usuarios = actual.usuarios.map((u) =>
        u.id === id ? { ...u, usuario: user, nombre, rol } : u,
      );
    } else {
      actual.usuarios.push({
        id: cuenta.id,
        usuario: cuenta.usuario,
        nombre: cuenta.nombre,
        rol: cuenta.rol,
        activo: true,
        creadoEn: cuenta.creadoEn,
      });
    }
    await guardarConfiguracion(actual);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(conParam("/configuracion?tab=usuarios", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/configuracion?tab=usuarios", "aviso", "Usuario guardado exitosamente."));
}

export async function eliminarUsuarioAction(formData: FormData) {
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    const { obtenerConfiguracion, guardarConfiguracion } = await import("@/lib/config");
    const actual = await obtenerConfiguracion();
    const id = String(formData.get("id") || "");

    await eliminarUsuarioCuenta(id);
    actual.usuarios = actual.usuarios.filter((u) => u.id !== id);
    await guardarConfiguracion(actual);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(conParam("/configuracion?tab=usuarios", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/configuracion?tab=usuarios", "aviso", "Usuario eliminado exitosamente."));
}
