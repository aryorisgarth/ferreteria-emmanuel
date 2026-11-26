import crypto from "crypto";
import {
  obtenerUsuariosJson,
  guardarUsuariosJson,
  type UsuarioCuenta,
} from "@/lib/auth";

export class JsonAuthRecoveryService {
  async generarTokenRecuperacion(
    usuarioOCorreo: string
  ): Promise<{ ok: true; tokenPlano?: string; correo?: string; usuario?: string }> {
    const term = (usuarioOCorreo || "").trim().toLowerCase();
    const usuarios = obtenerUsuariosJson();
    const idx = usuarios.findIndex(
      (u) =>
        u.usuario.trim().toLowerCase() === term ||
        (u.correo && u.correo.trim().toLowerCase() === term)
    );

    if (idx === -1) {
      return { ok: true };
    }

    const usuario = usuarios[idx];
    const tokenPlano = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(tokenPlano).digest("hex");
    const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    usuarios[idx] = {
      ...usuario,
      tokenRecuperacionHash: tokenHash,
      tokenRecuperacionExpira: expira,
    };
    guardarUsuariosJson(usuarios);

    return {
      ok: true,
      tokenPlano,
      correo: usuario.correo || usuario.usuario,
      usuario: usuario.usuario,
    };
  }

  async validarTokenRecuperacion(tokenPlano: string): Promise<UsuarioCuenta | null> {
    if (!tokenPlano || tokenPlano.trim().length < 16) return null;
    const tokenHash = crypto.createHash("sha256").update(tokenPlano.trim()).digest("hex");
    const ahora = new Date();
    const usuarios = obtenerUsuariosJson();

    const u = usuarios.find(
      (usr) =>
        usr.tokenRecuperacionHash === tokenHash &&
        usr.tokenRecuperacionExpira &&
        new Date(usr.tokenRecuperacionExpira) > ahora
    );

    return u || null;
  }

  async restablecerPasswordConToken(
    tokenPlano: string,
    nuevoPasswordHash: string
  ): Promise<boolean> {
    const usuarioValido = await this.validarTokenRecuperacion(tokenPlano);
    if (!usuarioValido) return false;

    const usuarios = obtenerUsuariosJson();
    const actualizados = usuarios.map((u) => {
      if (u.id === usuarioValido.id) {
        return {
          ...u,
          passwordHash: nuevoPasswordHash,
          debeCambiarClave: false,
          tokenRecuperacionHash: undefined,
          tokenRecuperacionExpira: undefined,
          versionCredencial: (u.versionCredencial || 1) + 1,
          intentosFallidos: 0,
          bloqueadoHasta: null,
        };
      }
      return u;
    });

    guardarUsuariosJson(actualizados);
    return true;
  }

  async restablecerAccesoAdmin(
    usuarioId: string,
    claveTemporalHash: string,
    adminUsuario: string
  ): Promise<boolean> {
    const usuarios = obtenerUsuariosJson();
    const existe = usuarios.find((u) => u.id === usuarioId);
    if (!existe) return false;

    const actualizados = usuarios.map((u) => {
      if (u.id === usuarioId) {
        return {
          ...u,
          passwordHash: claveTemporalHash,
          debeCambiarClave: true,
          tokenRecuperacionHash: undefined,
          tokenRecuperacionExpira: undefined,
          versionCredencial: (u.versionCredencial || 1) + 1,
          intentosFallidos: 0,
          bloqueadoHasta: null,
          modificadoPor: adminUsuario,
        };
      }
      return u;
    });

    guardarUsuariosJson(actualizados);
    return true;
  }

  async cambiarPasswordObligatorio(
    usuarioId: string,
    nuevoPasswordHash: string
  ): Promise<boolean> {
    const usuarios = obtenerUsuariosJson();
    const existe = usuarios.find((u) => u.id === usuarioId);
    if (!existe) return false;

    const actualizados = usuarios.map((u) => {
      if (u.id === usuarioId) {
        return {
          ...u,
          passwordHash: nuevoPasswordHash,
          debeCambiarClave: false,
          versionCredencial: (u.versionCredencial || 1) + 1,
        };
      }
      return u;
    });

    guardarUsuariosJson(actualizados);
    return true;
  }
}
