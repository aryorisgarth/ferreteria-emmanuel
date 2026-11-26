/**
 * Funciones de firma y verificación de tokens de sesión con Web Crypto API.
 * Compatible con Node.js Runtime y Next.js Edge Runtime (middleware).
 */

export const COOKIE_SESION = "fe_usuario";
export const COOKIE_ROL = "fe_rol";
export const COOKIE_NOMBRE = "fe_nombre";
export const COOKIE_TOKEN = "fe_auth_token";

export interface TokenPayloadVerificado {
  id: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "CAJERO" | "BODEGUERO" | "VENDEDOR";
  expiraEn: number;
}

const KNOWN_INSECURE_SECRETS = new Set([
  "FerreteriaEmmanuel_Nicaragua_2026_SecureSalt_#9223",
  "secret",
  "changeme",
  "12345678",
  "password",
  "admin",
  "test",
]);

let _ephemeralDevSecret: string | null = null;

function getEphemeralDevSecret(): string {
  if (!_ephemeralDevSecret) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    _ephemeralDevSecret = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return _ephemeralDevSecret;
}

/**
 * Obtiene y valida la clave criptográfica para firmas de sesión.
 * En producción (NODE_ENV === "production"), AUTH_SECRET es estrictamente obligatoria,
 * debe tener al menos 32 caracteres y no coincidir con ningún secreto conocido.
 * En desarrollo/pruebas locales, si no se proporciona, se utiliza un secreto efímero
 * en memoria generado para el ciclo de vida del proceso.
 */
export function obtenerAuthSecret(): string {
  const envSecret = process.env.AUTH_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!envSecret || envSecret.length < 32) {
      throw new Error(
        "CONFIGURACION_FATAL_SEGURIDAD: AUTH_SECRET no configurada o insuficiente para producción (mínimo 32 caracteres)."
      );
    }
    if (KNOWN_INSECURE_SECRETS.has(envSecret)) {
      throw new Error(
        "CONFIGURACION_FATAL_SEGURIDAD: AUTH_SECRET en producción coincide con un valor conocido o predeterminado inseguro."
      );
    }
    return envSecret;
  }

  if (envSecret && envSecret.length >= 16 && !KNOWN_INSECURE_SECRETS.has(envSecret)) {
    return envSecret;
  }

  return getEphemeralDevSecret();
}

/**
 * Comparación de tiempo constante resistente a ataques de temporización (Timing Attacks)
 */
export function timingSafeEqualConstant(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let c = 0;
  for (let i = 0; i < a.byteLength; i++) {
    c |= a[i] ^ b[i];
  }
  return c === 0;
}

/**
 * Genera la firma HMAC-SHA256 usando Web Crypto API
 */
export async function firmarTokenHMAC(payload: string, secreto?: string): Promise<string> {
  const sec = secreto || obtenerAuthSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sec),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Crea la cadena completa payload + firma
 */
export async function generarTokenSesion(
  id: string,
  usuario: string,
  rol: string,
  expiraEn: number,
  secreto?: string,
): Promise<string> {
  const payload = `${id}:${usuario}:${rol}:${expiraEn}`;
  const signature = await firmarTokenHMAC(payload, secreto);
  return `${payload}:${signature}`;
}

/**
 * Valida la autenticidad y fecha de expiración de un token de sesión
 */
export async function verificarTokenSesion(
  token: string | undefined | null,
  secreto?: string,
): Promise<TokenPayloadVerificado | null> {
  if (!token) return null;

  try {
    const partes = token.split(":");
    if (partes.length !== 5) return null;
    const [id, usuario, rol, expiraStr, signature] = partes;

    // Validación estricta de formato y longitud de firma HMAC SHA-256
    if (typeof signature !== "string" || signature.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(signature)) {
      return null;
    }

    const payload = `${id}:${usuario}:${rol}:${expiraStr}`;
    const expectedSignature = await firmarTokenHMAC(payload, secreto);

    if (typeof expectedSignature !== "string" || expectedSignature.length !== 64) {
      return null;
    }

    const encoder = new TextEncoder();
    const sigBuf = encoder.encode(signature.toLowerCase());
    const expBuf = encoder.encode(expectedSignature.toLowerCase());

    // Comparación segura en tiempo constante
    if (!timingSafeEqualConstant(sigBuf, expBuf)) {
      return null;
    }

    const expiraEn = Number(expiraStr);
    if (!Number.isFinite(expiraEn) || Date.now() > expiraEn) return null;

    if (!["ADMINISTRADOR", "CAJERO", "BODEGUERO", "VENDEDOR"].includes(rol)) {
      return null;
    }

    return {
      id,
      usuario,
      rol: rol as TokenPayloadVerificado["rol"],
      expiraEn,
    };
  } catch {
    return null;
  }
}
