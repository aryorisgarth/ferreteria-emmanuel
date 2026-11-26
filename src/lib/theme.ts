import {
  type TemaId,
  type TemaConfig,
  TEMAS_SISTEMA,
} from "./theme-definitions";

export type { TemaId, TemaConfig };
export { TEMAS_SISTEMA };

export const LISTA_TEMAS = Object.values(TEMAS_SISTEMA);
export const TEMA_PREDETERMINADO: TemaId = "emmanuel";

export function obtenerClaveAlmacenamientoTema(usuario?: string | null): string {
  const u = (usuario || "general").trim().toLowerCase();
  return `fe_theme_${u}`;
}

export function aplicarTemaDocumento(tema: TemaConfig) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  // Tokens Semánticos de Acento
  root.style.setProperty("--theme-primary", tema.colorHex);
  root.style.setProperty("--theme-primary-hover", tema.hoverHex);
  root.style.setProperty("--theme-primary-contrast", tema.contrastHex);
  root.style.setProperty("--theme-accent-light", tema.accentLightHex);
  root.style.setProperty("--theme-accent-border", tema.accentBorderHex);
  root.style.setProperty("--theme-ring", tema.ringRgba);
  root.style.setProperty("--theme-header-accent", tema.headerAccentHex);

  // Tokens Semánticos de Tono Suave (Header / Subnav)
  root.style.setProperty("--theme-header-bg", tema.headerBg);
  root.style.setProperty("--theme-header-subnav-bg", tema.headerSubnavBg);
  root.style.setProperty("--theme-header-border", tema.headerBorder);
  root.style.setProperty("--theme-header-input-bg", tema.headerInputBg);

  // Tokens Semánticos de Tono Profundo (Texto e Iconos en Cabecera)
  root.style.setProperty("--theme-header-text", tema.headerText);
  root.style.setProperty("--theme-header-text-muted", tema.headerTextMuted);
  root.style.setProperty("--theme-header-icon", tema.headerIcon);

  root.setAttribute("data-theme", tema.id);
}

export function resolverTema(id?: string | null): TemaConfig {
  if (id && id in TEMAS_SISTEMA) {
    return TEMAS_SISTEMA[id as TemaId];
  }
  return TEMAS_SISTEMA[TEMA_PREDETERMINADO];
}
