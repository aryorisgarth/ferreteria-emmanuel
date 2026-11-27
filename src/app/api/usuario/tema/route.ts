import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { obtenerSesionActual } from "@/lib/auth";
import { getAuthRepository } from "@/lib/repositories";
import { resolverTema, type TemaId } from "@/lib/theme";

export const dynamic = "force-dynamic";

/**
 * Endpoint ultra-liviano para sincronización pasiva entre dispositivos.
 * Responde con el tema persistido del usuario autenticado en Neon PostgreSQL.
 */
export async function GET() {
  try {
    const sesion = await obtenerSesionActual();
    const jar = await cookies();
    const usuario = sesion?.usuario || jar.get("fe_usuario")?.value;

    if (!usuario) {
      const cookieTema = (jar.get("fe_tema")?.value || "emmanuel") as TemaId;
      return NextResponse.json(
        { tema: resolverTema(cookieTema).id, usuario: null },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const repo = getAuthRepository();
    let tema = "emmanuel";
    if ("obtenerTemaUsuario" in repo && typeof repo.obtenerTemaUsuario === "function") {
      tema = await repo.obtenerTemaUsuario(usuario);
    }

    const temaResuelto = resolverTema(tema).id;
    return NextResponse.json(
      { tema: temaResuelto, usuario },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    return NextResponse.json(
      { tema: "emmanuel", error: "Error al consultar tema" },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
