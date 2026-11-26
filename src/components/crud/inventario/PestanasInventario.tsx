"use client";

import { ArrowUpDown, ClipboardList, Package, Plus } from "lucide-react";
import type { TabInventario } from "./tipos";

interface PestanasInventarioProps {
  tab: TabInventario;
  setTab: (tab: TabInventario) => void;
  totalArticulos: number;
  totalAjustes: number;
  totalConteos: number;
  onNuevoArticulo: () => void;
  onNuevoAjuste: () => void;
  onNuevoConteo: () => void;
}

export function PestanasInventario({
  tab,
  setTab,
  totalArticulos,
  totalAjustes,
  totalConteos,
  onNuevoArticulo,
  onNuevoAjuste,
  onNuevoConteo,
}: PestanasInventarioProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white px-3.5 py-2 rounded-[6px] shadow-2xs">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setTab("productos")}
          style={
            tab === "productos"
              ? {
                  backgroundColor: "var(--theme-primary)",
                  color: "var(--theme-primary-contrast)",
                  borderColor: "var(--theme-primary)",
                }
              : undefined
          }
          className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs font-bold transition border ${
            tab === "productos"
              ? "shadow-2xs"
              : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Package size={14} />
          <span>Productos ({totalArticulos})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("ajustes")}
          style={
            tab === "ajustes"
              ? {
                  backgroundColor: "var(--theme-primary)",
                  color: "var(--theme-primary-contrast)",
                  borderColor: "var(--theme-primary)",
                }
              : undefined
          }
          className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs font-bold transition border ${
            tab === "ajustes"
              ? "shadow-2xs"
              : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ArrowUpDown size={14} />
          <span>Ajustes de Inventario ({totalAjustes})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("conteos")}
          style={
            tab === "conteos"
              ? {
                  backgroundColor: "var(--theme-primary)",
                  color: "var(--theme-primary-contrast)",
                  borderColor: "var(--theme-primary)",
                }
              : undefined
          }
          className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs font-bold transition border ${
            tab === "conteos"
              ? "shadow-2xs"
              : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ClipboardList size={14} />
          <span>Conteo Físico ({totalConteos})</span>
        </button>
      </div>

      {tab === "productos" && (
        <button
          type="button"
          onClick={onNuevoArticulo}
          className="btn btn-amarillo h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]"
        >
          <Plus size={15} />
          Nuevo Artículo
        </button>
      )}

      {tab === "ajustes" && (
        <button
          type="button"
          onClick={onNuevoAjuste}
          className="btn btn-amarillo h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]"
        >
          <Plus size={15} />
          Nuevo Ajuste
        </button>
      )}

      {tab === "conteos" && (
        <button
          type="button"
          onClick={onNuevoConteo}
          className="btn btn-amarillo h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]"
        >
          <Plus size={15} />
          Nuevo Conteo Físico
        </button>
      )}
    </div>
  );
}
