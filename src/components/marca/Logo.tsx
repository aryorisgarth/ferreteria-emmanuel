"use client";

import Image from "next/image";

type Variante = "color" | "light" | "dark" | "gold";

interface LogoProps {
  variante?: Variante;
  compacto?: boolean;
  stacked?: boolean;
  className?: string;
  prioridad?: boolean;
}

/**
 * Isotipo Oficial de Ferretería Emmanuel (Construcción con la letra 'E')
 * Extraído directamente del archivo oficial logo.jpeg manteniendo proporción estricta (260x250).
 */
export function HouseMark({
  className = "h-10 w-auto",
  alt = "Isotipo Ferretería Emmanuel",
}: {
  variante?: Variante;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/isotipo.png"
      alt={alt}
      width={260}
      height={250}
      className={`shrink-0 object-contain aspect-[260/250] ${className}`}
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    />
  );
}

/**
 * Logotipo Completo Oficial de Ferretería Emmanuel
 * Incorpora el logo oficial completo manteniendo su proporción original estricta (992x250 ≈ 3.97:1).
 * Soporta versión sobre fondo oscuro (variante 'light' o 'dark') o fondo claro transparente.
 */
export function Logo({
  variante = "color",
  compacto = false,
  className = "",
  prioridad = false,
}: LogoProps) {
  const src = variante === "dark" ? "/logo-oficial-dark.png" : "/logo-oficial.png";
  const heightClase = className || (compacto ? "h-7 sm:h-7.5" : "h-7.5 sm:h-8");

  return (
    <div
      className="inline-flex items-center select-none shrink-0"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <img
        src={src}
        alt="Ferretería Emmanuel - Logo Oficial"
        width={992}
        height={250}
        loading={prioridad ? "eager" : "lazy"}
        className={`w-auto object-contain aspect-[992/250] transition-transform duration-150 ${heightClase}`}
      />
    </div>
  );
}

/**
 * Logotipo para Documentos Oficiales e Impresiones (Facturas, Cotizaciones, Reportes)
 */
export function LogoReporteInstitucional({
  className = "h-12 w-auto",
}: {
  className?: string;
}) {
  return (
    <div
      className="inline-flex items-center bg-transparent select-none"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <img
        src="/logo-oficial.png"
        alt="Ferretería Emmanuel"
        width={992}
        height={250}
        className={`object-contain aspect-[992/250] ${className}`}
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      />
    </div>
  );
}

/**
 * Marca de agua oficial para comprobantes y reportes
 */
export function MarcaAguaDocumento({
  orientacion = "horizontal",
  className = "",
}: {
  orientacion?: "horizontal" | "vertical";
  className?: string;
}) {
  const esHorizontal = orientacion === "horizontal";

  return (
    <div
      aria-hidden="true"
      className={`watermark pointer-events-none select-none opacity-[0.06] flex items-center justify-center ${
        esHorizontal ? "watermark-horizontal" : "watermark-vertical"
      } ${className}`}
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <img
        src="/logo-oficial.png"
        alt=""
        width={992}
        height={250}
        className={esHorizontal ? "h-36 sm:h-44 w-auto object-contain aspect-[992/250]" : "h-28 sm:h-36 w-auto object-contain aspect-[992/250]"}
      />
    </div>
  );
}

export function MarcaAguaImpresion({
  orientacion = "vertical",
  className = "",
}: {
  orientacion?: "vertical" | "horizontal";
  className?: string;
}) {
  return <MarcaAguaDocumento orientacion={orientacion} className={className} />;
}
