import crypto from "crypto";
import { hashLegacySHA256 } from "./crypto-pass";
import type { UsuarioCuenta } from "./auth";
import { getAuthRepository } from "@/lib/repositories";

const rateLimitMap = new Map<string, number>();

export async function solicitarRecuperacionPassword(
  usuarioOEmail: string
): Promise<{ ok: true; mensaje: string }> {
  const cleanInput = (usuarioOEmail || "").trim().toLowerCase();
  const respuestaNeutral = {
    ok: true as const,
    mensaje:
      "Si el usuario o correo está registrado, se han enviado las instrucciones para restablecer el acceso a su bandeja de entrada.",
  };

  if (!cleanInput) return respuestaNeutral;

  // Rate Limiting: 1 solicitud cada 3 minutos por usuario/identificador
  const ahora = Date.now();
  const ultimoIntento = rateLimitMap.get(cleanInput);
  if (ultimoIntento && ahora - ultimoIntento < 180000) {
    return respuestaNeutral;
  }
  rateLimitMap.set(cleanInput, ahora);

  try {
    const repo = getAuthRepository() as any;
    if (typeof repo.generarTokenRecuperacion === "function") {
      const res = await repo.generarTokenRecuperacion(cleanInput);
      if (res?.tokenPlano) {
        // En entorno local de pruebas sin SMTP, se registra en log de seguridad
        console.log(
          `[RECUPERACIÓN SEGURA] Token emitido para @${res.usuario}: http://localhost:3000/recuperar?token=${res.tokenPlano}`
        );
      }
    }
  } catch (err) {
    console.error("Error al procesar recuperación:", err);
  }

  return respuestaNeutral;
}

export async function validarTokenRecuperacion(
  tokenPlano: string
): Promise<UsuarioCuenta | null> {
  if (!tokenPlano || tokenPlano.trim().length < 16) return null;
  const repo = getAuthRepository() as any;
  if (typeof repo.validarTokenRecuperacion === "function") {
    return repo.validarTokenRecuperacion(tokenPlano.trim());
  }
  return null;
}

export async function aplicarNuevaPassword(
  tokenPlano: string,
  nuevaPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const clave = (nuevaPassword || "").trim();
  if (clave.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const nuevoHash = hashLegacySHA256(clave);
  const repo = getAuthRepository() as any;
  if (typeof repo.restablecerPasswordConToken === "function") {
    const exito = await repo.restablecerPasswordConToken(tokenPlano, nuevoHash);
    if (!exito) {
      return { ok: false, error: "El enlace de recuperación es inválido o ha expirado." };
    }
    return { ok: true };
  }
  return { ok: false, error: "Servicio de recuperación no disponible." };
}

export async function adminRestablecerAcceso(
  usuarioId: string,
  adminUsuario: string,
  adminRol: string
): Promise<{ ok: boolean; claveTemporal?: string; error?: string }> {
  if (adminRol !== "ADMINISTRADOR") {
    return { ok: false, error: "Acceso no autorizado: solo el Administrador puede restablecer accesos." };
  }

  const digitos = Math.floor(100000 + Math.random() * 900000);
  const claveTemporal = `EM-${digitos}`;
  const hashTemporal = hashLegacySHA256(claveTemporal);

  const repo = getAuthRepository() as any;
  if (typeof repo.restablecerAccesoAdmin === "function") {
    const exito = await repo.restablecerAccesoAdmin(usuarioId, hashTemporal, adminUsuario);
    if (!exito) {
      return { ok: false, error: "No se pudo restablecer el acceso para el usuario indicado." };
    }
    return { ok: true, claveTemporal };
  }

  return { ok: false, error: "Repositorio no soporta restablecimiento administrativo." };
}

export async function cambiarPasswordForzada(
  usuarioId: string,
  nuevaPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const clave = (nuevaPassword || "").trim();
  if (clave.length < 6) {
    return { ok: false, error: "La contraseña definitiva debe tener al menos 6 caracteres." };
  }
  const nuevoHash = hashLegacySHA256(clave);
  const repo = getAuthRepository() as any;
  if (typeof repo.cambiarPasswordObligatorio === "function") {
    const exito = await repo.cambiarPasswordObligatorio(usuarioId, nuevoHash);
    return exito ? { ok: true } : { ok: false, error: "No se pudo actualizar la contraseña." };
  }
  return { ok: false, error: "Operación no soportada." };
}
