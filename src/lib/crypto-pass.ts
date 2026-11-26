import crypto from "crypto";

export function getSaltGlobal(): string {
  return process.env.AUTH_SECRET || "FerreteriaEmmanuel_Nicaragua_2026_SecureSalt_#9223";
}

export type AlgoritmoPassword = "sha256" | "scrypt" | "argon2id";

export interface HashResultado {
  algoritmo: AlgoritmoPassword;
  hash: string;
}

export function hashModerno(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const saltGlobal = getSaltGlobal();
  const derivado = crypto.scryptSync(password, salt + saltGlobal, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  });
  return `$scrypt$s=${salt}$h=${derivado.toString("hex")}`;
}

export function hashLegacySHA256(password: string): string {
  const saltGlobal = getSaltGlobal();
  return crypto.createHash("sha256").update(password + saltGlobal).digest("hex");
}

export function verificarPassword(
  passwordIngresada: string,
  hashAlmacenado: string
): { esValida: boolean; requiereActualizacion: boolean } {
  if (!hashAlmacenado || !passwordIngresada) {
    return { esValida: false, requiereActualizacion: false };
  }

  const saltGlobal = getSaltGlobal();
  const saltGlobalFallback = "FerreteriaEmmanuel_Nicaragua_2026_SecureSalt_#9223";

  // 1. Hash moderno ($scrypt$)
  if (hashAlmacenado.startsWith("$scrypt$")) {
    try {
      const partes = hashAlmacenado.split("$").filter(Boolean);
      const saltParam = partes.find((p) => p.startsWith("s="));
      const hashParam = partes.find((p) => p.startsWith("h="));

      if (!saltParam || !hashParam) return { esValida: false, requiereActualizacion: false };

      const salt = saltParam.substring(2);
      const hashEsperado = Buffer.from(hashParam.substring(2), "hex");

      // Intento 1: Con el saltGlobal configurado en el entorno (AUTH_SECRET)
      const derivado = crypto.scryptSync(passwordIngresada, salt + saltGlobal, hashEsperado.length, {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 32 * 1024 * 1024,
      });

      if (crypto.timingSafeEqual(derivado, hashEsperado)) {
        return { esValida: true, requiereActualizacion: false };
      }

      // Intento 2: Con el saltGlobal canónico de inicialización (por si AUTH_SECRET en Vercel difiere)
      if (saltGlobal !== saltGlobalFallback) {
        const derivadoFallback = crypto.scryptSync(
          passwordIngresada,
          salt + saltGlobalFallback,
          hashEsperado.length,
          { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 }
        );
        if (crypto.timingSafeEqual(derivadoFallback, hashEsperado)) {
          return { esValida: true, requiereActualizacion: true };
        }
      }

      return { esValida: false, requiereActualizacion: false };
    } catch {
      return { esValida: false, requiereActualizacion: false };
    }
  }

  // 2. Hash legacy SHA-256
  const hashLegacy = hashLegacySHA256(passwordIngresada);
  const bufferIngresado = Buffer.from(hashLegacy, "hex");
  const bufferAlmacenado = Buffer.from(hashAlmacenado, "hex");

  if (bufferIngresado.length === bufferAlmacenado.length) {
    const coincideLegacy = crypto.timingSafeEqual(bufferIngresado, bufferAlmacenado);
    if (coincideLegacy) {
      return { esValida: true, requiereActualizacion: true };
    }
  }

  // 3. Compatibilidad de migración con clave directa en texto plano
  const coincidePlano =
    hashAlmacenado === passwordIngresada ||
    hashAlmacenado === passwordIngresada.trim();

  return { esValida: coincidePlano, requiereActualizacion: coincidePlano };
}
