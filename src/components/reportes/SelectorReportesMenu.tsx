"use client";

import { CATEGORIAS_MENU, REPORTES_DISPONIBLES } from "./catalogo-reportes";
import type { ReporteDef, ReporteId } from "./tipos";

interface SelectorReportesMenuProps {
  catSel: string;
  setCatSel: (cat: string) => void;
  reporteSel: ReporteId;
  setReporteSel: (id: ReporteId) => void;
  reportesFiltrados: ReporteDef[];
}

export function SelectorReportesMenu({
  catSel,
  setCatSel,
  reporteSel,
  setReporteSel,
  reportesFiltrados,
}: SelectorReportesMenuProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      {/* Menú Lateral de Áreas */}
      <div className="md:col-span-3 bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">Áreas</p>
        {CATEGORIAS_MENU.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCatSel(c.id)}
            style={
              catSel === c.id
                ? {
                    backgroundColor: "var(--theme-primary)",
                    color: "var(--theme-primary-contrast)",
                  }
                : undefined
            }
            className={`w-full flex items-center justify-between rounded-[5px] px-2.5 py-1.5 text-xs font-semibold transition ${
              catSel === c.id ? "font-bold shadow-2xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{c.label}</span>
            <span className="text-[10px] opacity-60 font-mono">
              {c.id === "TODOS"
                ? REPORTES_DISPONIBLES.length
                : REPORTES_DISPONIBLES.filter((r) => r.categoria === c.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Cuadrícula de Reportes */}
      <div className="md:col-span-9 bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Seleccionar Reporte Oficial
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {reportesFiltrados.map((rep) => {
            const Icono = rep.icono;
            const activo = rep.id === reporteSel;

            return (
              <button
                key={rep.id}
                type="button"
                onClick={() => setReporteSel(rep.id)}
                className={`flex items-start gap-2.5 p-2.5 rounded-[5px] border text-left transition ${
                  activo
                    ? "border-slate-800 bg-slate-50 ring-1 ring-slate-800/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`p-1.5 rounded-[4px] shrink-0 ${
                    activo ? "bg-slate-900 text-white font-bold" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icono size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${activo ? "text-slate-950 font-extrabold" : "text-slate-800"}`}>
                    {rep.titulo}
                  </p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{rep.subtitulo}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
