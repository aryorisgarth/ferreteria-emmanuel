import React from "react";
import { Logo, MarcaAguaDocumento } from "@/components/marca/Logo";

interface PlantillaProps {
  titulo: string;
  orientacion?: "horizontal" | "vertical";
  children: React.ReactNode;
}

export function PlantillaReporteInstitucional({
  titulo,
  orientacion = "horizontal",
  children,
}: PlantillaProps) {
  return (
    <article
      className={`hoja-reporte-institucional ${orientacion === "horizontal" ? "reporte-apaisado" : "reporte-vertical"
        } relative mx-auto w-full bg-white print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none`}
    >
      <MarcaAguaDocumento orientacion={orientacion} />

      <div className="relative z-10 w-full">
        <header className="mb-2 text-center select-none print:mb-2.5">
          <div className="flex justify-center mb-1.5">
            <Logo variante="color" className="h-10 sm:h-12 w-auto mx-auto" />
          </div>
          <h1 className="font-sans text-[20px] sm:text-[22px] font-bold text-[#1e40af] tracking-tight leading-none mb-2">
            {titulo}
          </h1>
        </header>

        {/* Tabla Documental que Ocupa Prácticamente Todo el Ancho Útil (90-95%) */}
        <div className="w-full overflow-x-auto print:overflow-visible">
          {children}
        </div>
      </div>
    </article>
  );
}
