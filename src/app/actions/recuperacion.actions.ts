"use server";

import { redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth";
import {
  solicitarRecuperacionPassword,
  validarTokenRecuperacion,
  aplicarNuevaPassword,
  adminRestablecerAcceso,
  cambiarPasswordForzada,
} from "@/lib/auth-recovery";
import { conParam, mensaje, refrescar, type ResultadoAccion } from "./helpers";

export type ResultadoRecuperacion = {
  ok: boolean;
  mensaje?: string;
  error?: string;
} | null;

export async function solicitarRecuperacionWebAction(
  _previo: ResultadoRecuperacion,
  formData: FormData
): Promise<ResultadoRecuperacion> {
  const identificador = String(formData.get("usuarioOEmail") || "");
  const res = await solicitarRecuperacionPassword(identificador);
  return { ok: true, mensaje: res.mensaje };
}

export async function restablecerPasswordTokenAction(
  _previo: ResultadoRecuperacion,
  formData: FormData
): Promise<ResultadoRecuperacion> {
  const token = String(formData.get("token") || "");
  const clave1 = String(formData.get("password") || "");
  const clave2 = String(formData.get("confirmPassword") || "");

  if (clave1 !== clave2) {
    return { ok: false, error: "Las contraseñas ingresadas no coinciden." };
  }

  const res = await aplicarNuevaPassword(token, clave1);
  if (!res.ok) {
    return { ok: false, error: res.error || "No se pudo actualizar la contraseña." };
  }

  return {
    ok: true,
    mensaje: "Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva clave.",
  };
}

export async function adminRestablecerAccesoAction(
  formData: FormData
): Promise<{ ok: boolean; claveTemporal?: string; error?: string }> {
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR"]);
    const usuarioId = String(formData.get("usuarioId") || "");
    if (!usuarioId) {
      return { ok: false, error: "ID de usuario no proporcionado." };
    }

    const res = await adminRestablecerAcceso(usuarioId, sesion.usuario, sesion.rol);
    refrescar();
    return res;
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }
}

export async function cambiarPasswordObligatoriaAction(
  _previo: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  try {
    const sesion = await exigirSesion();
    const clave1 = String(formData.get("password") || "");
    const clave2 = String(formData.get("confirmPassword") || "");

    if (clave1 !== clave2) {
      return { ok: false, error: "Las contraseñas no coinciden." };
    }

    const res = await cambiarPasswordForzada(sesion.id, clave1);
    if (!res.ok) {
      return { ok: false, error: res.error || "Error al actualizar clave." };
    }
  } catch (error) {
    return { ok: false, error: mensaje(error) };
  }

  refrescar();
  redirect("/inicio?aviso=Contrase%C3%B1a+personal+configurada+con+%C3%A9xito.");
}
