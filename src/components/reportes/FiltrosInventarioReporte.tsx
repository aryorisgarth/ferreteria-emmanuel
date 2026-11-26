"use client";

import { Search } from "lucide-react";

interface FiltrosInventarioReporteProps {
  filtroCategoria: string;
  setFiltroCategoria: (val: string) => void;
  categoriasDisponibles: string[];
  filtroMarca: string;
  setFiltroMarca: (val: string) => void;
  marcasDisponibles: string[];
  busqueda: string;
  setBusqueda: (val: string) => void;
  soloStockBajo: boolean;
  setSoloStockBajo: (val: boolean) => void;
  totalArticulos: number;
}

export function FiltrosInventarioReporte({
  filtroCategoria,
  setFiltroCategoria,
  categoriasDisponibles,
  filtroMarca,
  setFiltroMarca,
  marcasDisponibles,
  busqueda,
  setBusqueda,
  soloStockBajo,
  setSoloStockBajo,
  totalArticulos,
}: FiltrosInventarioReporteProps) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
      <div className="flex-1 min-w-[160px] max-w-xs">
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
        >
          <option value="TODAS">Todas las Categorías</option>
          {categoriasDisponibles.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[160px] max-w-xs">
        <select
          value={filtroMarca}
          onChange={(e) => setFiltroMarca(e.target.value)}
          className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
        >
          <option value="TODAS">Todas las Marcas</option>
          {marcasDisponibles.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar artículo..."
          className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs outline-none focus:border-brand-yellow"
        />
      </div>

      <label className="flex items-center gap-2 h-8 px-3 rounded-md border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100">
        <input
          type="checkbox"
          checked={soloStockBajo}
          onChange={(e) => setSoloStockBajo(e.target.checked)}
          className="rounded border-slate-300 text-amber-600 focus:ring-brand-yellow"
        />
        <span>Solo Stock Bajo</span>
      </label>

      <span className="ml-auto text-xs font-mono text-slate-500 font-semibold">
        {totalArticulos} artículos mostrados
      </span>
    </div>
  );
}
