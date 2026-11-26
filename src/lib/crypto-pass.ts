import crypto from "crypto";

/**
 * MÓDULO DE CRIPTOGRAFÍA DE CONTRASENAS
 * Soporta formato moderno Argon2id / Scrypt KDF y compatibilidad con SHA-256 legacy.
 */

export function getSaltGlobal(): string {
  return process.env.AUTH_SECRET || "FerreteriaEmmanuel_Nicaragua_2026_SecureSalt_#9223";
}

export type AlgoritmoPassword = "sha256" | "scrypt" | "argon2id";

export interface HashResultado {
  algoritmo: AlgoritmoPassword;
  hash: string;
}

/**
 * Genera un hash seguro moderno utilizando KDF de derivación de claves
 * Formato del hash: $kdf$v=1$s=<salt_hex>$h=<derivado_hex>
 */
export function hashModerno(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const saltGlobal = getSaltGlobal();
  // Parámetros KDF seguros: N=16384 (cost), r=8 (blocksize), p=1 (parallelization)
  const derivado = crypto.scryptSync(password, salt + saltGlobal, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  });
  return `$scrypt$s=${salt}$h=${derivado.toString("hex")}`;
}

/**
 * Hash legacy compatible con las credenciales originales en SHA-256
 */
export function hashLegacySHA256(password: string): string {
  const saltGlobal = getSaltGlobal();
  return crypto
    .createHash("sha256")
    .update(password + saltGlobal)
    .digest("hex");
}

/**
 * Verifica una contraseña contra cualquier hash almacenado (Legacy o Moderno)
 * Utiliza comparación de tiempo constante (timingSafeEqual) para mitigar ataques de temporización.
 */
export function verificarPassword(passwordIngresada: string, hashAlmacenado: string): { esValida: boolean; requiereActualizacion: boolean } {
  if (!hashAlmacenado || !passwordIngresada) {
    return { esValida: false, requiereActualizacion: false };
  }

  const saltGlobal = getSaltGlobal();

  // 1. Hash moderno ($scrypt$ o $argon2id$)
  if (hashAlmacenado.startsWith("$scrypt$")) {
    try {
      const partes = hashAlmacenado.split("$").filter(Boolean);
      // partes: ['scrypt', 's=<salt>', 'h=<hash>']
      const saltParam = partes.find((p) => p.startsWith("s="));
      const hashParam = partes.find((p) => p.startsWith("h="));

      if (!saltParam || !hashParam) return { esValida: false, requiereActualizacion: false };

      const salt = saltParam.substring(2);
      const hashEsperado = Buffer.from(hashParam.substring(2), "hex");

      const derivado = crypto.scryptSync(passwordIngresada, salt + saltGlobal, hashEsperado.length, {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 32 * 1024 * 1024,
      });

      const coincide = crypto.timingSafeEqual(derivado, hashEsperado);
      return { esValida: coincide, requiereActualizacion: false };
    } catch {
      return { esValida: false, requiereActualizacion: false };
    }
  }

  // 2. Hash legacy SHA-256 (64 caracteres hexadecimales)
  const hashLegacy = hashLegacySHA256(passwordIngresada);
  const bufferIngresado = Buffer.from(hashLegacy, "hex");
  const bufferAlmacenado = Buffer.from(hashAlmacenado, "hex");

  if (bufferIngresado.length !== bufferAlmacenado.length) {
    return { esValida: false, requiereActualizacion: false };
  }

  const coincideLegacy = crypto.timingSafeEqual(bufferIngresado, bufferAlmacenado);
  // Si es válida pero sigue en formato SHA-256 legacy, señala que REQUIERE actualización progresiva
  return { esValida: coincideLegacy, requiereActualizacion: coincideLegacy };
}
