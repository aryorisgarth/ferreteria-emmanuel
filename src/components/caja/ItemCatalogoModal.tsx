"use client";

import { Minus, Plus, Check } from "lucide-react";
import { useState } from "react";
import { dinero, etiquetaUnidad } from "@/lib/format";
import type { ProductoVista } from "@/lib/types";

interface ItemCatalogoModalProps {
  producto: ProductoVista;
  simboloMoneda: string;
  cantidad: number;
  onCambiarCantidad: (cant: number) => void;
  onAgregar: (producto: ProductoVista, cantidad: number) => void;
}

export function ItemCatalogoModal({
  producto: p,
  simboloMoneda,
  cantidad,
  onCambiarCantidad,
  onAgregar,
}: ItemCatalogoModalProps) {
  const [agregadoReciente, setAgregadoReciente] = useState(false);
  const sinStock = p.stockActual <= 0;
  const stockBajo = !sinStock && p.stockMinimo && p.stockActual <= p.stockMinimo;

  const handleAgregar = () => {
    if (sinStock) return;
    onAgregar(p, cantidad);
    setAgregadoReciente(true);
    setTimeout(() => setAgregadoReciente(false), 900);
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
              {p.codigo}
            </span>
            {p.marca && (
              <span className="text-[10px] font-medium text-slate-500 uppercase">
                {p.marca}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              sinStock
                ? "bg-rose-100 text-rose-700"
                : stockBajo
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {sinStock ? "Agotado" : `${p.stockActual} ${etiquetaUnidad(p.unidadMedida)}`}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2 min-h-[2.5rem]">
          {p.nombre}
        </h4>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-medium text-slate-400 block">Precio Unitario</span>
          <span className="font-mono text-base font-black text-slate-900">
            {dinero(p.precio, simboloMoneda)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stepper numérico táctil */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            <button
              type="button"
              disabled={sinStock || cantidad <= 1}
              onClick={() => onCambiarCantidad(Math.max(1, cantidad - 1))}
              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition"
            >
              <Minus size={12} />
            </button>
            <input
              type="number"
              min={1}
              max={p.stockActual > 0 ? p.stockActual : 1}
              value={cantidad}
              onChange={(e) => onCambiarCantidad(Math.max(1, parseFloat(e.target.value) || 1))}
              disabled={sinStock}
              className="w-10 h-7 text-center font-mono text-xs font-bold bg-white border-x border-slate-200 outline-none focus:bg-amber-50"
            />
            <button
              type="button"
              disabled={sinStock || (p.stockActual > 0 && cantidad >= p.stockActual)}
              onClick={() => onCambiarCantidad(cantidad + 1)}
              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition"
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAgregar}
            disabled={sinStock}
            className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
              agregadoReciente
                ? "bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {agregadoReciente ? (
              <>
                <Check size={14} className="animate-bounce" />
                <span>¡Listo!</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
