import type { IAuthRepository } from "../types";
import type { UsuarioCuenta, RolUsuario } from "@/lib/auth";
import { query, SqlExecutor } from "./client";
import {
  dbObtenerUsuarios,
  dbBuscarPorUsuario,
  dbBuscarPorId,
} from "./auth/auth-queries";
import {
  dbGuardarUsuarios,
  dbCrearOActualizarUsuario,
  dbEliminarUsuario,
} from "./auth/auth-mutations";
import {
  dbRegistrarIntentoFallido,
  dbResetearIntentos,
} from "./auth/auth-bruteforce";
import {
  dbGenerarTokenRecuperacion,
  dbValidarTokenRecuperacion,
  dbRestablecerPasswordConToken,
  dbRestablecerAccesoAdmin,
  dbCambiarPasswordObligatorio,
} from "./auth/auth-recovery";

export class PostgresAuthRepository implements IAuthRepository {
  private executor: SqlExecutor;

  constructor(customExecutor?: SqlExecutor) {
    this.executor = customExecutor || { query };
  }

  async obtenerUsuarios(): Promise<UsuarioCuenta[]> {
    return dbObtenerUsuarios(this.executor);
  }

  async guardarUsuarios(usuarios: UsuarioCuenta[]): Promise<void> {
    return dbGuardarUsuarios(this.executor, usuarios);
  }

  async buscarPorUsuario(nombreUsuario: string): Promise<UsuarioCuenta | null> {
    return dbBuscarPorUsuario(this.executor, nombreUsuario);
  }

  async buscarPorId(id: string): Promise<UsuarioCuenta | null> {
    return dbBuscarPorId(this.executor, id);
  }

  async crearOActualizarUsuario(input: {
    id?: string;
    usuario: string;
    nombre: string;
    rol: RolUsuario;
    clave?: string;
    activo?: boolean;
    correo?: string;
  }): Promise<UsuarioCuenta> {
    return dbCrearOActualizarUsuario(this.executor, input);
  }

  async eliminarUsuario(id: string): Promise<void> {
    return dbEliminarUsuario(this.executor, id);
  }

  async registrarIntentoFallido(
    id: string,
    maxIntentos?: number,
    tiempoBloqueoMinutos?: number
  ): Promise<{ intentos: number; bloqueadoHasta: string | null }> {
    return dbRegistrarIntentoFallido(this.executor, id, maxIntentos, tiempoBloqueoMinutos);
  }

  async resetearIntentos(id: string): Promise<void> {
    return dbResetearIntentos(this.executor, id);
  }

  async generarTokenRecuperacion(usuarioOCorreo: string) {
    return dbGenerarTokenRecuperacion(this.executor, usuarioOCorreo);
  }

  async validarTokenRecuperacion(tokenPlano: string) {
    return dbValidarTokenRecuperacion(this.executor, tokenPlano);
  }

  async restablecerPasswordConToken(tokenPlano: string, nuevoPasswordHash: string) {
    return dbRestablecerPasswordConToken(this.executor, tokenPlano, nuevoPasswordHash);
  }

  async restablecerAccesoAdmin(usuarioId: string, claveTemporalHash: string, adminUsuario: string) {
    return dbRestablecerAccesoAdmin(this.executor, usuarioId, claveTemporalHash, adminUsuario);
  }

  async cambiarPasswordObligatorio(usuarioId: string, nuevoPasswordHash: string) {
    return dbCambiarPasswordObligatorio(this.executor, usuarioId, nuevoPasswordHash);
  }
}
