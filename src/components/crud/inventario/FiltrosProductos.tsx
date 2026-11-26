"use client";

import { Search } from "lucide-react";

interface FiltrosProductosProps {
  q: string;
  setQ: (val: string) => void;
  categoriaSel: string;
  setCategoriaSel: (val: string) => void;
  categoriasDisponibles: string[];
  marcaSel: string;
  setMarcaSel: (val: string) => void;
  marcasOpciones: string[];
  estadoSel: "TODOS" | "ACTIVOS" | "INACTIVOS";
  setEstadoSel: (val: "TODOS" | "ACTIVOS" | "INACTIVOS") => void;
  totalArticulosFiltrados: number;
  onCambioFiltro: (cambios: {
    categoria?: string;
    marca?: string;
    estado?: "TODOS" | "ACTIVOS" | "INACTIVOS";
    page?: number;
  }) => void;
}

export function FiltrosProductos({
  q,
  setQ,
  categoriaSel,
  setCategoriaSel,
  categoriasDisponibles,
  marcaSel,
  setMarcaSel,
  marcasOpciones,
  estadoSel,
  setEstadoSel,
  totalArticulosFiltrados,
  onCambioFiltro,
}: FiltrosProductosProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs">
      <div className="relative flex-1 max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código, código de barras, nombre, categoría o marca..."
          className="h-9 w-full rounded-[5px] border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-slate-400 focus:bg-white"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        <select
          value={categoriaSel}
          onChange={(e) => {
            const val = e.target.value;
            setCategoriaSel(val);
            onCambioFiltro({ categoria: val, page: 1 });
          }}
          className="h-9 rounded-[5px] border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
        >
          <option value="TODAS">Todas las Categorías</option>
          {categoriasDisponibles.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={marcaSel}
          onChange={(e) => {
            const val = e.target.value;
            setMarcaSel(val);
            onCambioFiltro({ marca: val, page: 1 });
          }}
          className="h-9 rounded-[5px] border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
        >
          <option value="TODAS">Todas las Marcas</option>
          {marcasOpciones.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={estadoSel}
          onChange={(e) => {
            const val = e.target.value as "TODOS" | "ACTIVOS" | "INACTIVOS";
            setEstadoSel(val);
            onCambioFiltro({ estado: val, page: 1 });
          }}
          className="h-9 rounded-[5px] border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
        >
          <option value="TODOS">Todos los Estados</option>
          <option value="ACTIVOS">Solo Activos</option>
          <option value="INACTIVOS">Solo Inactivos</option>
        </select>

        <span className="text-xs text-slate-500 font-medium whitespace-nowrap pl-2">
          {totalArticulosFiltrados} artículo{totalArticulosFiltrados === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
