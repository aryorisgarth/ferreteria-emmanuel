export type TemaId = "emmanuel" | "azul" | "esmeralda" | "rosa" | "lila" | "naranja" | "amarillo";

export interface TemaConfig {
  id: TemaId;
  nombre: string;
  descripcion: string;
  headerBg: string;
  headerSubnavBg: string;
  headerBorder: string;
  headerInputBg: string;
  accentLightHex: string;
  accentBorderHex: string;
  colorHex: string;
  hoverHex: string;
  contrastHex: string;
  ringRgba: string;
  headerAccentHex: string;
  headerText: string;
  headerTextMuted: string;
  headerIcon: string;
}

export const TEMAS_SISTEMA: Record<TemaId, TemaConfig> = {
  emmanuel: {
    id: "emmanuel",
    nombre: "Ejecutivo Corporativo (Moderno)",
    descripcion: "Estilo empresarial sobrio: cabecera técnica blanca, acentos en pizarra profunda y contraste limpio.",
    headerBg: "#FFFFFF",
    headerSubnavBg: "#F1F5F9",
    headerBorder: "#E2E8F0",
    headerInputBg: "#F8FAFC",
    accentLightHex: "#F1F5F9",
    accentBorderHex: "#CBD5E1",
    colorHex: "#0F172A",
    hoverHex: "#1E293B",
    contrastHex: "#FFFFFF",
    ringRgba: "rgba(37, 99, 235, 0.2)",
    headerAccentHex: "#0F172A",
    headerText: "#0F172A",
    headerTextMuted: "#64748B",
    headerIcon: "#334155",
  },
  azul: {
    id: "azul",
    nombre: "Azul Empresarial",
    descripcion: "Corporativo sobrio y confiable: cabecera suave azul hielo, botones zafiro y tipografía naval.",
    headerBg: "#EFF6FF",
    headerSubnavBg: "#DBEAFE",
    headerBorder: "#BFDBFE",
    headerInputBg: "#FFFFFF",
    accentLightHex: "#EFF6FF",
    accentBorderHex: "#BFDBFE",
    colorHex: "#2563EB",
    hoverHex: "#1D4ED8",
    contrastHex: "#FFFFFF",
    ringRgba: "rgba(37, 99, 235, 0.25)",
    headerAccentHex: "#2563EB",
    headerText: "#1E3A8A",
    headerTextMuted: "#1D4ED8",
    headerIcon: "#1E3A8A",
  },
  amarillo: {
    id: "amarillo",
    nombre: "Amarillo Ferretero Clásico",
    descripcion: "Identidad clásica ferretera: marfil cálido, acentos dorados y contraste negro.",
    headerBg: "#FEFCE8",
    headerSubnavBg: "#FEF9C3",
    headerBorder: "#FDE047",
    headerInputBg: "#FFFFFF",
    accentLightHex: "#FEF9C3",
    accentBorderHex: "#FDE047",
    colorHex: "#FACC15",
    hoverHex: "#EAB308",
    contrastHex: "#0F172A",
    ringRgba: "rgba(234, 179, 8, 0.25)",
    headerAccentHex: "#EAB308",
    headerText: "#713F12",
    headerTextMuted: "#A16207",
    headerIcon: "#713F12",
  },
  esmeralda: {
    id: "esmeralda",
    nombre: "Verde Esmeralda",
    descripcion: "Fresco para descanso visual: cabecera en verde menta tenue y botones esmeralda.",
    headerBg: "#F0FDF4",
    headerSubnavBg: "#DCFCE7",
    headerBorder: "#A7F3D0",
    headerInputBg: "#FFFFFF",
    accentLightHex: "#F0FDF4",
    accentBorderHex: "#A7F3D0",
    colorHex: "#059669",
    hoverHex: "#047857",
    contrastHex: "#FFFFFF",
    ringRgba: "rgba(5, 150, 105, 0.25)",
    headerAccentHex: "#059669",
    headerText: "#064E3B",
    headerTextMuted: "#047857",
    headerIcon: "#064E3B",
  },
  rosa: {
    id: "rosa",
    nombre: "Rosa Elegante",
    descripcion: "Distinción contemporánea: cabecera suave rubí y botones frambuesa.",
    headerBg: "#FDF2F8",
    headerSubnavBg: "#FCE7F3",
    headerBorder: "#FBCFE8",
    headerInputBg: "#FFFFFF",
    accentLightHex: "#FDF2F8",
    accentBorderHex: "#FBCFE8",
    colorHex: "#DB2777",
    hoverHex: "#BE185D",
    contrastHex: "#FFFFFF",
    ringRgba: "rgba(219, 39, 119, 0.25)",
    headerAccentHex: "#DB2777",
    headerText: "#831843",
    headerTextMuted: "#9D174D",
    headerIcon: "#831843",
  },
  lila: {
    id: "lila",
    nombre: "Lila Moderno",
    descripcion: "Estilo vanguardista: cabecera en lavanda suave y botones violeta.",
    headerBg: "#F5F3FF",
    headerSubnavBg: "#EDE9FE",
    headerBorder: "#DDD6FE",
    headerInputBg: "#FFFFFF",
    accentLightHex: "#F5F3FF",
    accentBorderHex: "#DDD6FE",
    colorHex: "#7C3AED",
    hoverHex: "#6D28D9",
    contrastHex: "#FFFFFF",
    ringRgba: "rgba(124, 58, 237, 0.25)",
    headerAccentHex: "#7C3AED",
    headerText: "#4C1D95",
    headerTextMuted: "#5B21B6",
    headerIcon: "#4C1D95",
  },
  naranja: {
    id: "naranja",
    nombre: "Naranja Comercial",
    descripcion: "Dinamismo comercial cálido: melocotón suave y mandarina vibrante.",
    headerBg: "#FFF7ED",
    headerSubnavBg: "#FFEDD5",
    headerBorder: "#FED7AA",
    headerInputBg: "#FFFFFF",
    accentLightHex: "#FFF7ED",
    accentBorderHex: "#FED7AA",
    colorHex: "#EA580C",
    hoverHex: "#C2410C",
    contrastHex: "#FFFFFF",
    ringRgba: "rgba(234, 88, 12, 0.25)",
    headerAccentHex: "#EA580C",
    headerText: "#7C2D12",
    headerTextMuted: "#9A3412",
    headerIcon: "#7C2D12",
  },
};
