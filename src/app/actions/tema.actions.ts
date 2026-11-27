"use server";

import { cookies } from "next/headers";
import { getAuthRepository } from "@/lib/repositories";
import { resolverTema, type TemaId } from "@/lib/theme";
import { obtenerSesionActual } from "@/lib/auth";

export interface ResultadoTemaAction {
  ok: boolean;
  tema: TemaId;
  error?: string;
}

/**
 * Fija de forma persistente el tema para el usuario autenticado en Neon PostgreSQL
 * y actualiza la cookie fe_tema para renderizado SSR instantáneo.
 */
export async function fijarTemaAction(temaId: TemaId): Promise<ResultadoTemaAction> {
  try {
    const temaValido = resolverTema(temaId).id;
    const sesion = await obtenerSesionActual();
    const usuario = sesion?.usuario;

    // Actualizar cookie inmediata accesible tanto en servidor como cliente
    const jar = await cookies();
    jar.set("fe_tema", temaValido, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    if (usuario) {
      const repo = getAuthRepository();
      if ("guardarTemaUsuario" in repo && typeof repo.guardarTemaUsuario === "function") {
        await repo.guardarTemaUsuario(usuario, temaValido);
      }
    }

    return { ok: true, tema: temaValido };
  } catch (err: any) {
    console.error("[fijarTemaAction] Error:", err);
    return { ok: false, tema: temaId, error: err?.message || "No se pudo fijar el tema" };
  }
}

/**
 * Consulta el tema persistido del usuario desde Neon PostgreSQL o cookie de respaldo
 */
export async function obtenerTemaUsuarioAction(): Promise<ResultadoTemaAction> {
  try {
    const sesion = await obtenerSesionActual();
    if (!sesion?.usuario) {
      const jar = await cookies();
      const cookieTema = (jar.get("fe_tema")?.value || "emmanuel") as TemaId;
      return { ok: true, tema: resolverTema(cookieTema).id };
    }

    const repo = getAuthRepository();
    let temaId = "emmanuel";
    if ("obtenerTemaUsuario" in repo && typeof repo.obtenerTemaUsuario === "function") {
      temaId = await repo.obtenerTemaUsuario(sesion.usuario);
    }

    return { ok: true, tema: resolverTema(temaId).id };
  } catch {
    return { ok: true, tema: "emmanuel" };
  }
}
