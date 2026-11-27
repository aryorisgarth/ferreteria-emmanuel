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

export async function fijarTemaAction(temaId: TemaId): Promise<ResultadoTemaAction> {
  try {
    const temaValido = resolverTema(temaId).id;
    const sesion = await obtenerSesionActual();
    const jar = await cookies();
    const usuario = sesion?.usuario || jar.get("fe_usuario")?.value;

    if (!usuario) {
      return { ok: false, tema: temaId, error: "No hay una sesión activa para fijar la preferencia." };
    }

    const repo = getAuthRepository();
    let persistido = false;
    if ("guardarTemaUsuario" in repo && typeof repo.guardarTemaUsuario === "function") {
      persistido = await repo.guardarTemaUsuario(usuario, temaValido);
    }

    if (!persistido) {
      return {
        ok: false,
        tema: temaId,
        error: "No se pudo guardar la preferencia en PostgreSQL.",
      };
    }

    jar.set("fe_tema", temaValido, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return { ok: true, tema: temaValido };
  } catch (err: any) {
    console.error("[fijarTemaAction] Error:", err);
    return { ok: false, tema: temaId, error: err?.message || "Error al fijar tema" };
  }
}

export async function obtenerTemaUsuarioAction(): Promise<ResultadoTemaAction> {
  try {
    const sesion = await obtenerSesionActual();
    const jar = await cookies();
    const usuario = sesion?.usuario || jar.get("fe_usuario")?.value;
    if (!usuario) {
      const cookieTema = (jar.get("fe_tema")?.value || "emmanuel") as TemaId;
      return { ok: true, tema: resolverTema(cookieTema).id };
    }

    const repo = getAuthRepository();
    let temaId = "emmanuel";
    if ("obtenerTemaUsuario" in repo && typeof repo.obtenerTemaUsuario === "function") {
      temaId = await repo.obtenerTemaUsuario(usuario);
    }

    return { ok: true, tema: resolverTema(temaId).id };
  } catch {
    return { ok: true, tema: "emmanuel" };
  }
}
