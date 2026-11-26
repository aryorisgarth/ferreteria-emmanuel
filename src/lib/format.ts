import type { EstadoAuditoria, EstadoFactura, EstadoSolicitud, FormaPago, TipoMovimiento, UnidadMedida } from "@/lib/types";

export const RENGLONES_POR_HOJA = 20;

export const COLUMNAS_KARDEX = [
  "Fecha",
  "Código/Producto",
  "U. Medida",
  "Tipo Mov.",
  "Entradas",
  "Salidas",
  "Stock Saldo",
  "Destinatario/Oficina",
  "No. Acta/Ref",
  "Concepto/Observación",
  "Usuario",
  "Estado Auditoría",
] as const;

export const UNIDADES: UnidadMedida[] = [
  "UNIDAD",
  "METRO",
  "METRO_CUBICO",
  "KILOGRAMO",
  "LIBRA",
  "BOLSA",
  "CAJA",
  "GALON",
  "LITRO",
  "ROLLO",
  "PAR",
  "JUEGO",
  "TUBO",
  "VARILLA",
  "LAMINA",
  "QUINTAL",
  "PIE",
  "YARDA",
];

const ETIQUETA_UNIDAD: Record<UnidadMedida, string> = {
  UNIDAD: "Und",
  METRO: "m",
  METRO_CUBICO: "m³",
  KILOGRAMO: "kg",
  LIBRA: "lb",
  BOLSA: "Bolsa",
  CAJA: "Caja",
  GALON: "Gal",
  LITRO: "L",
  ROLLO: "Rollo",
  PAR: "Par",
  JUEGO: "Juego",
  TUBO: "Tubo",
  VARILLA: "Varilla",
  LAMINA: "Lámina",
  QUINTAL: "Quintal",
  PIE: "Pie",
  YARDA: "Yda",
};

export function etiquetaUnidad(unidad?: string | UnidadMedida): string {
  if (!unidad) return "Und";
  const normalizada = unidad.trim().toUpperCase().replace(/[\s-]+/g, "_") as UnidadMedida;
  if (ETIQUETA_UNIDAD[normalizada]) {
    return ETIQUETA_UNIDAD[normalizada];
  }
  const limpia = unidad.trim();
  if (!limpia) return "Und";
  return limpia.charAt(0).toUpperCase() + limpia.slice(1).toLowerCase();
}

export function etiquetaEstado(estado: EstadoSolicitud) {
  if (estado === "PENDIENTE_DE_REVISION") return "Pendiente de revisión";
  if (estado === "APROBADO") return "Aprobado";
  return "Entregado";
}

export function etiquetaTipo(tipo: TipoMovimiento) {
  if (tipo === "ENTRADA") return "Entrada";
  if (tipo === "SALIDA") return "Salida";
  return "Ajuste";
}

export function etiquetaPago(pago: FormaPago) {
  return {
    EFECTIVO: "Efectivo",
    TRANSFERENCIA: "Transferencia",
    TARJETA: "Tarjeta",
    CREDITO: "Crédito",
    MIXTO: "Mixto (Efectivo + Transf.)",
  }[pago] || pago;
}

export function etiquetaFactura(estado: EstadoFactura) {
  return { EMITIDA: "Por cobrar", PAGADA: "Pagada", ANULADA: "Anulada" }[estado];
}

export function etiquetaAuditoria(esAuditoria: boolean, estado: EstadoAuditoria) {
  if (!esAuditoria) return "Normal";
  if (estado === "OBSERVADO") return "Observado";
  return "En auditoría";
}

export function r3(valor: number) {
  return Math.round((valor + Number.EPSILON) * 1000) / 1000;
}

export function r2(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function dinero(valor: number, simbolo = "C$") {
  const formateado = new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
  return `${simbolo} ${formateado}`;
}

export function numero(valor: number) {
  return new Intl.NumberFormat("es-NI", { maximumFractionDigits: 3 }).format(valor);
}

export function fechaCorta(iso?: string) {
  if (!iso || typeof iso !== "string") return "";
  const [anio, mes, dia] = iso.split("-");
  return `${dia || ""}/${mes || ""}/${anio || ""}`;
}

export function fechaLarga(iso?: string) {
  if (!iso || typeof iso !== "string") iso = hoyISO();
  const partes = iso.split("-").map(Number);
  const anio = partes[0] || new Date().getFullYear();
  const mes = partes[1] || new Date().getMonth() + 1;
  const dia = partes[2] || new Date().getDate();
  return new Intl.DateTimeFormat("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, dia)));
}

export function hoyISO() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function paginar<T>(filas: T[], pagina: number | "ultima" | undefined): {
  rows: T[];
  page: number;
  pages: number;
  total: number;
} {
  const total = filas.length;
  const pages = Math.max(1, Math.ceil(total / RENGLONES_POR_HOJA));
  let page = pagina === "ultima" || pagina === undefined ? 1 : Number(pagina);
  if (pagina === "ultima") page = pages;
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (page > pages) page = pages;
  const inicio = (page - 1) * RENGLONES_POR_HOJA;
  return {
    rows: filas.slice(inicio, inicio + RENGLONES_POR_HOJA),
    page,
    pages,
    total,
  };
}
