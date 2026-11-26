"use client";

export const ORIGEN_X = 300;
export const ORIGEN_Y = 240; // Elevado ligeramente para dar máxima holgura en el tercio inferior
const COS30 = 0.866025;
const SIN30 = 0.5;

export function iso(x: number, y: number, z: number): [number, number] {
  const screenX = ORIGEN_X + (x - z) * COS30;
  const screenY = ORIGEN_Y + (x + z) * SIN30 - y;
  return [Math.round(screenX * 10) / 10, Math.round(screenY * 10) / 10];
}

export function pts(...puntos: [number, number, number][]): string {
  return puntos.map((p) => iso(p[0], p[1], p[2]).join(",")).join(" ");
}

export type TemaAmbiente = "dia" | "atardecer" | "noche";

export const TEMAS = {
  dia: {
    nombre: "Luz Diurna",
    cielo: "bg-slate-900",
    fondoGradiente: "radial-gradient(circle at 50% 20%, #1e293b 0%, #090d16 100%)",
    terreno: "#334155",
    terrenoBorde: "#475569",
    concretoFront: "#64748b",
    concretoSide: "#475569",
    concretoTop: "#94a3b8",
    bloqueClaro: "#e2e8f0",
    bloqueMedio: "#cbd5e1",
    bloqueOscuro: "#94a3b8",
    mortero: "#64748b",
    zincLuz: "#ffffff",
    zincMedio: "#e2e8f0",
    zincSombra: "#94a3b8",
    cumbrera: "#cbd5e1",
    lineaZinc: "#64748b",
    repelloLuz: "#f8fafc",
    repelloSombra: "#e2e8f0",
    aceroPerlin: "#0284c7",
    aceroCercha: "#0369a1",
    farolLuz: false,
    resplandorSuelo: "rgba(148, 163, 184, 0.08)",
  },
  atardecer: {
    nombre: "Atardecer Cálido",
    cielo: "bg-stone-950",
    fondoGradiente: "radial-gradient(circle at 60% 15%, #451a03 0%, #1c1917 60%, #0c0a09 100%)",
    terreno: "#44403c",
    terrenoBorde: "#78716c",
    concretoFront: "#78716c",
    concretoSide: "#57534e",
    concretoTop: "#a8a29e",
    bloqueClaro: "#fed7aa",
    bloqueMedio: "#fdba74",
    bloqueOscuro: "#a8a29e",
    mortero: "#78716c",
    zincLuz: "#ffedd5",
    zincMedio: "#fed7aa",
    zincSombra: "#a8a29e",
    cumbrera: "#fdba74",
    lineaZinc: "#78716c",
    repelloLuz: "#ffedd5",
    repelloSombra: "#fcd34d",
    aceroPerlin: "#ea580c",
    aceroCercha: "#c2410c",
    farolLuz: true,
    resplandorSuelo: "rgba(251, 146, 60, 0.12)",
  },
  noche: {
    nombre: "Noche Arquitectónica",
    cielo: "bg-slate-950",
    fondoGradiente: "radial-gradient(circle at 50% 30%, #0f172a 0%, #020617 100%)",
    terreno: "#1e293b",
    terrenoBorde: "#334155",
    concretoFront: "#334155",
    concretoSide: "#1e293b",
    concretoTop: "#475569",
    bloqueClaro: "#94a3b8",
    bloqueMedio: "#64748b",
    bloqueOscuro: "#475569",
    mortero: "#334155",
    zincLuz: "#cbd5e1",
    zincMedio: "#94a3b8",
    zincSombra: "#475569",
    cumbrera: "#64748b",
    lineaZinc: "#334155",
    repelloLuz: "#cbd5e1",
    repelloSombra: "#94a3b8",
    aceroPerlin: "#38bdf8",
    aceroCercha: "#0284c7",
    farolLuz: true,
    resplandorSuelo: "rgba(250, 204, 21, 0.15)",
  },
};
