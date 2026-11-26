"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import type { ReporteDef } from "./tipos";

interface BarraEncabezadoReporteProps {
  reporteActual: ReporteDef;
  onExportarExcel: () => void;
  onImprimir: () => void;
}

export function BarraEncabezadoReporte({
  reporteActual,
  onExportarExcel,
  onImprimir,
}: BarraEncabezadoReporteProps) {
  return (
    <div className="bg-white p-4 rounded border border-slate-300 shadow-2xs flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <Logo variante="color" className="h-9 sm:h-10 w-auto shrink-0" />
        <div>
          <div className="text-[11px] font-bold uppercase text-[#dc2626] tracking-wider">
            FERRETERÍA EMMANUEL · SALDO DE APERTURA Y REPORTES
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#1e40af]">{reporteActual.titulo}</h2>
          <p className="text-xs text-slate-500 font-medium">{reporteActual.subtitulo}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/inventario/nuevo"
          className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white h-9 px-3.5 text-xs font-bold rounded flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus size={14} />
          <span>+ Agregar artículo</span>
        </Link>
        <button
          type="button"
          onClick={onExportarExcel}
          className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 h-9 px-3.5 text-xs font-bold rounded transition shadow-2xs cursor-pointer"
        >
          Excel
        </button>
        <button
          type="button"
          onClick={onImprimir}
          className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white h-9 px-3.5 text-xs font-bold rounded transition shadow-xs cursor-pointer"
        >
          PDF
        </button>
        <button
          type="button"
          onClick={onImprimir}
          className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 h-9 px-3.5 text-xs font-bold rounded transition shadow-2xs cursor-pointer"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
}
