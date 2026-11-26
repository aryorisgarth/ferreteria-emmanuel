"use client";

import { Minus, Plus, Check } from "lucide-react";
import { useState } from "react";
import { dinero, etiquetaUnidad } from "@/lib/format";
import type { ProductoVista } from "@/lib/types";

interface FilaCatalogoModalProps {
  producto: ProductoVista;
  simboloMoneda: string;
  cantidad: number;
  onCambiarCantidad: (cant: number) => void;
  onAgregar: (producto: ProductoVista, cantidad: number) => void;
}

export function FilaCatalogoModal({
  producto: p,
  simboloMoneda,
  cantidad,
  onCambiarCantidad,
  onAgregar,
}: FilaCatalogoModalProps) {
  const [agregado, setAgregado] = useState(false);
  const sinStock = p.stockActual <= 0;
  const stockBajo = !sinStock && p.stockMinimo && p.stockActual <= p.stockMinimo;

  const handleAgregar = () => {
    if (sinStock) return;
    onAgregar(p, cantidad);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 900);
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-amber-50/40 transition-colors">
      {/* Código y Barras */}
      <td className="py-3 px-4 align-middle whitespace-nowrap">
        <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {p.codigo}
        </span>
        {p.codigoBarras && (
          <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
            {p.codigoBarras}
          </span>
        )}
      </td>

      {/* Nombre y Marca */}
      <td className="py-3 px-4 align-middle min-w-[280px]">
        <span className="text-sm font-bold text-slate-900 leading-snug block">
          {p.nombre}
        </span>
        {p.marca && (
          <span className="text-[11px] font-semibold text-amber-800/80 uppercase tracking-wide">
            Marca: {p.marca}
          </span>
        )}
      </td>

      {/* Categoría */}
      <td className="py-3 px-4 align-middle whitespace-nowrap">
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
          {p.categoria || "General"}
        </span>
      </td>

      {/* Stock en Tiempo Real */}
      <td className="py-3 px-4 align-middle whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            sinStock
              ? "bg-rose-100 text-rose-800"
              : stockBajo
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${sinStock ? "bg-rose-500" : stockBajo ? "bg-amber-500" : "bg-emerald-500"}`} />
          {sinStock ? "Agotado" : `${p.stockActual} ${etiquetaUnidad(p.unidadMedida)}`}
        </span>
      </td>

      {/* Precio */}
      <td className="py-3 px-4 align-middle whitespace-nowrap">
        <span className="font-mono text-sm font-black text-slate-900">
          {dinero(p.precio, simboloMoneda)}
        </span>
      </td>

      {/* Cantidad Táctil Stepper */}
      <td className="py-3 px-4 align-middle whitespace-nowrap">
        <div className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-50 overflow-hidden shadow-2xs">
          <button
            type="button"
            disabled={sinStock || cantidad <= 1}
            onClick={() => onCambiarCantidad(Math.max(1, cantidad - 1))}
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition"
          >
            <Minus size={13} />
          </button>
          <input
            type="number"
            min={1}
            max={p.stockActual > 0 ? p.stockActual : 1}
            value={cantidad}
            onChange={(e) => onCambiarCantidad(Math.max(1, parseFloat(e.target.value) || 1))}
            disabled={sinStock}
            className="w-12 h-7 text-center font-mono text-xs font-bold bg-white border-x border-slate-300 outline-none focus:bg-amber-50"
          />
          <button
            type="button"
            disabled={sinStock || (p.stockActual > 0 && cantidad >= p.stockActual)}
            onClick={() => onCambiarCantidad(cantidad + 1)}
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition"
          >
            <Plus size={13} />
          </button>
        </div>
      </td>

      {/* Acción Agregar */}
      <td className="py-3 px-4 align-middle whitespace-nowrap text-right">
        <button
          type="button"
          onClick={handleAgregar}
          disabled={sinStock}
          className={`h-8 px-4 rounded-lg text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-xs ${
            agregado
              ? "bg-emerald-600 text-white shadow-emerald-600/30"
              : "bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95"
          } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {agregado ? (
            <>
              <Check size={14} className="stroke-[3]" />
              <span>¡Agregado!</span>
            </>
          ) : (
            <>
              <Plus size={14} className="stroke-[3]" />
              <span>Agregar</span>
            </>
          )}
        </button>
      </td>
    </tr>
  );
}
