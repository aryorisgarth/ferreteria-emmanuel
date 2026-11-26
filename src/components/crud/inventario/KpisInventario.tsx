"use client";

import { AlertTriangle, Package } from "lucide-react";
import { dinero } from "@/lib/format";

interface KpisInventarioProps {
  totalArticulos: number;
  stockBajoCount: number;
  valorInventario: number;
  soloStockBajo: boolean;
  onToggleStockBajo: () => void;
  esAdmin: boolean;
}

export function KpisInventario({
  totalArticulos,
  stockBajoCount,
  valorInventario,
  soloStockBajo,
  onToggleStockBajo,
  esAdmin,
}: KpisInventarioProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-slate-100 text-slate-800 font-bold">
          <Package size={18} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Artículos</p>
          <p className="text-lg font-extrabold text-slate-900 tracking-tight">{totalArticulos}</p>
        </div>
      </div>

      <div
        onClick={onToggleStockBajo}
        className={`cursor-pointer p-3.5 rounded-[6px] border shadow-2xs flex items-center justify-between transition ${
          soloStockBajo
            ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/30"
            : "bg-white border-slate-200 hover:border-rose-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-rose-100 text-rose-700 font-bold">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Stock Crítico</p>
            <p className="text-lg font-extrabold text-rose-700 tracking-tight">{stockBajoCount} por reponer</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-rose-600 underline">
          {soloStockBajo ? "Ver todos" : "Filtrar"}
        </span>
      </div>

      {esAdmin && (
        <div className="bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Valor Estimado en Bodega</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight">{dinero(valorInventario)}</p>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-[4px]">
            Costo adquisición
          </span>
        </div>
      )}
    </div>
  );
}
