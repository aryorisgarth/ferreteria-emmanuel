import {
  obtenerUsuariosJson,
  guardarUsuariosJson,
  crearOActualizarUsuarioCuentaJson,
  eliminarUsuarioCuentaJson,
  type UsuarioCuenta,
  type RolUsuario,
} from "@/lib/auth";
import type { IAuthRepository } from "../types";
import { JsonAuthRecoveryService } from "./json-auth-recovery";

export class JsonAuthRepository implements IAuthRepository {
  private recovery = new JsonAuthRecoveryService();

  async obtenerUsuarios(): Promise<UsuarioCuenta[]> {
    return obtenerUsuariosJson();
  }

  async guardarUsuarios(usuarios: UsuarioCuenta[]): Promise<void> {
    guardarUsuariosJson(usuarios);
  }

  async buscarPorUsuario(nombreUsuario: string): Promise<UsuarioCuenta | null> {
    const usuarios = obtenerUsuariosJson();
    return (
      usuarios.find(
        (u) => u.usuario.trim().toLowerCase() === nombreUsuario.trim().toLowerCase()
      ) ?? null
    );
  }

  async buscarPorId(id: string): Promise<UsuarioCuenta | null> {
    const usuarios = obtenerUsuariosJson();
    return usuarios.find((u) => u.id === id) ?? null;
  }

  async crearOActualizarUsuario(input: {
    id?: string;
    usuario: string;
    nombre: string;
    rol: RolUsuario;
    clave?: string;
    activo?: boolean;
  }): Promise<UsuarioCuenta> {
    return crearOActualizarUsuarioCuentaJson(input);
  }

  async eliminarUsuario(id: string): Promise<void> {
    eliminarUsuarioCuentaJson(id);
  }

  async registrarIntentoFallido(
    id: string,
    maxIntentos = 5,
    tiempoBloqueoMinutos = 10
  ): Promise<{ intentos: number; bloqueadoHasta: string | null }> {
    const usuarios = obtenerUsuariosJson();
    let res = { intentos: 1, bloqueadoHasta: null as string | null };
    const actualizados = usuarios.map((u) => {
      if (u.id === id) {
        const intentos = (u.intentosFallidos || 0) + 1;
        let bloqueadoHasta: string | null = u.bloqueadoHasta || null;
        if (intentos >= maxIntentos) {
          bloqueadoHasta = new Date(Date.now() + tiempoBloqueoMinutos * 60000).toISOString();
        }
        res = { intentos, bloqueadoHasta };
        return { ...u, intentosFallidos: intentos, bloqueadoHasta };
      }
      return u;
    });
    guardarUsuariosJson(actualizados);
    return res;
  }

  async resetearIntentos(id: string): Promise<void> {
    const usuarios = obtenerUsuariosJson();
    const actualizados = usuarios.map((u) =>
      u.id === id
        ? {
            ...u,
            intentosFallidos: 0,
            bloqueadoHasta: null,
            ultimoAcceso: new Date().toISOString(),
          }
        : u
    );
    guardarUsuariosJson(actualizados);
  }

  // Métodos de recuperación y restablecimiento seguro
  generarTokenRecuperacion = (usuarioOCorreo: string) =>
    this.recovery.generarTokenRecuperacion(usuarioOCorreo);

  validarTokenRecuperacion = (tokenPlano: string) =>
    this.recovery.validarTokenRecuperacion(tokenPlano);

  restablecerPasswordConToken = (tokenPlano: string, nuevoPasswordHash: string) =>
    this.recovery.restablecerPasswordConToken(tokenPlano, nuevoPasswordHash);

  restablecerAccesoAdmin = (
    usuarioId: string,
    claveTemporalHash: string,
    adminUsuario: string
  ) => this.recovery.restablecerAccesoAdmin(usuarioId, claveTemporalHash, adminUsuario);

  cambiarPasswordObligatorio = (usuarioId: string, nuevoPasswordHash: string) =>
    this.recovery.cambiarPasswordObligatorio(usuarioId, nuevoPasswordHash);

  async obtenerTemaUsuario(usuarioOId: string): Promise<string> {
    const usuarios = obtenerUsuariosJson();
    const clean = usuarioOId.trim().toLowerCase();
    const u = usuarios.find((usr) => usr.usuario.toLowerCase() === clean || usr.id === usuarioOId);
    return (u && (u as any).tema) || "emmanuel";
  }

  async guardarTemaUsuario(usuarioOId: string, tema: string): Promise<boolean> {
    const usuarios = obtenerUsuariosJson();
    const clean = usuarioOId.trim().toLowerCase();
    let modificado = false;
    const actualizados = usuarios.map((usr) => {
      if (usr.usuario.toLowerCase() === clean || usr.id === usuarioOId) {
        modificado = true;
        return { ...usr, tema };
      }
      return usr;
    });
    if (modificado) {
      guardarUsuariosJson(actualizados);
    }
    return modificado;
  }
}
