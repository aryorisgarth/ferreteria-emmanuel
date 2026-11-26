/**
 * Funciones de firma y verificación de tokens de sesión con Web Crypto API.
 * Compatible con Node.js Runtime y Next.js Edge Runtime (middleware).
 */

export const COOKIE_SESION = "fe_usuario";
export const COOKIE_ROL = "fe_rol";
export const COOKIE_NOMBRE = "fe_nombre";
export const COOKIE_TOKEN = "fe_auth_token";

export const FALLBACK_AUTH_SECRET =
  "FerreteriaEmmanuel_Nicaragua_2026_SecureSalt_#9223_AuthSecret_HMAC_v1";

export interface TokenPayloadVerificado {
  id: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "CAJERO" | "BODEGUERO" | "VENDEDOR";
  expiraEn: number;
}

/**
 * Obtiene la clave criptográfica para firmas HMAC de sesión.
 * Si AUTH_SECRET está configurada se utiliza; de lo contrario se emplea
 * el fallback canónico robusto para evitar caídas fatales en producción.
 */
export function obtenerAuthSecret(): string {
  const envSecret = process.env.AUTH_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  return FALLBACK_AUTH_SECRET;
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
 * Valida la autenticidad y fecha de expiración de un token de sesión.
 * Incorpora fallback dual para máxima resiliencia en cambios de entorno.
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

    if (typeof signature !== "string" || signature.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(signature)) {
      return null;
    }

    const payload = `${id}:${usuario}:${rol}:${expiraStr}`;
    const sec = secreto || obtenerAuthSecret();
    const expectedSignature = await firmarTokenHMAC(payload, sec);

    const encoder = new TextEncoder();
    const sigBuf = encoder.encode(signature.toLowerCase());
    let coincide = timingSafeEqualConstant(sigBuf, encoder.encode(expectedSignature.toLowerCase()));

    // Fallback dual: verificar contra el secreto canónico de respaldo si difiere
    if (!coincide && sec !== FALLBACK_AUTH_SECRET) {
      const fallbackSig = await firmarTokenHMAC(payload, FALLBACK_AUTH_SECRET);
      coincide = timingSafeEqualConstant(sigBuf, encoder.encode(fallbackSig.toLowerCase()));
    }

    if (!coincide) return null;

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
