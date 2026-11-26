"use client";

import { Search, Plus } from "lucide-react";
import { dinero, etiquetaUnidad, numero } from "@/lib/format";
import type { OpcionVenta } from "./tipos";

interface BuscadorRapidoArticuloProps {
  busquedaArticulo: string;
  setBusquedaArticulo: (val: string) => void;
  desplegableAbierto: boolean;
  setDesplegableAbierto: (val: boolean) => void;
  resultadosBusqueda: OpcionVenta[];
  onAgregarArticulo: (art: OpcionVenta) => void;
  simboloMoneda: string;
}

export function BuscadorRapidoArticulo({
  busquedaArticulo,
  setBusquedaArticulo,
  desplegableAbierto,
  setDesplegableAbierto,
  resultadosBusqueda,
  onAgregarArticulo,
  simboloMoneda,
}: BuscadorRapidoArticuloProps) {
  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={busquedaArticulo}
            onChange={(e) => {
              setBusquedaArticulo(e.target.value);
              setDesplegableAbierto(true);
            }}
            onFocus={() => setDesplegableAbierto(true)}
            placeholder="Escribe el nombre, código o marca del artículo para agregarlo a la lista..."
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 shadow-2xs transition-all"
          />
        </div>
      </div>

      {desplegableAbierto && resultadosBusqueda.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
          {resultadosBusqueda.map((prod) => {
            const sinStock = prod.stockActual <= 0;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => {
                  onAgregarArticulo(prod);
                  setDesplegableAbierto(false);
                }}
                className="w-full p-3 text-left hover:bg-amber-50/60 transition flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                      {prod.codigo}
                    </span>
                    {prod.marca && (
                      <span className="text-[10px] font-bold text-amber-800 uppercase">
                        {prod.marca}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        sinStock ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      Stock: {numero(prod.stockActual)} {etiquetaUnidad(prod.unidadMedida)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-amber-800 transition-colors mt-0.5 truncate">
                    {prod.nombre}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-black text-slate-900">
                    {dinero(prod.precio, simboloMoneda)}
                  </span>
                  <span className="h-7 px-2.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-2xs">
                    <Plus size={12} />
                    <span>Agregar</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
