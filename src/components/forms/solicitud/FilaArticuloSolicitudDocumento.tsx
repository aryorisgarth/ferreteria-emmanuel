"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { etiquetaUnidad } from "@/lib/format";
import type { OpcionProducto } from "@/components/forms/CapturaLineas";

export interface FilaSolicitudDoc {
  productoId: string;
  cantidad: number;
  observacion: string;
}

export function FilaArticuloSolicitudDocumento({
  indice,
  fila,
  articulo,
  onActualizar,
  onQuitar,
}: {
  indice: number;
  fila: FilaSolicitudDoc;
  articulo?: OpcionProducto;
  onActualizar: (delta: Partial<FilaSolicitudDoc>) => void;
  onQuitar: () => void;
}) {
  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50/80 transition text-xs">
      <td className="py-2.5 px-3 font-mono font-bold text-slate-500 text-center">{indice + 1}</td>
      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{articulo?.codigo ?? "—"}</td>
      <td className="py-2.5 px-3 text-slate-600 font-medium">BODEGA PPAL</td>
      <td className="py-2.5 px-3 font-semibold text-slate-900">{articulo?.nombre ?? "Artículo no especificado"}</td>
      <td className="py-2.5 px-3 text-center">
        <div className="inline-flex items-center border border-slate-300 rounded bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => onActualizar({ cantidad: Math.max(1, fila.cantidad - 1) })}
            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 text-slate-600 border-r border-slate-200"
          >
            <Minus size={11} />
          </button>
          <input
            type="number"
            min="1"
            value={fila.cantidad}
            onChange={(e) => onActualizar({ cantidad: Math.max(1, Number(e.target.value) || 1) })}
            className="w-12 h-6 text-center font-mono font-bold text-xs outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={() => onActualizar({ cantidad: fila.cantidad + 1 })}
            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 text-slate-600 border-l border-slate-200"
          >
            <Plus size={11} />
          </button>
        </div>
      </td>
      <td className="py-2.5 px-3 text-slate-700 font-medium text-center uppercase text-[11px]">
        {articulo ? etiquetaUnidad(articulo.unidadMedida) : "UND"}
      </td>
      <td className="py-2.5 px-3">
        <input
          value={fila.observacion}
          onChange={(e) => onActualizar({ observacion: e.target.value })}
          placeholder="Ej. Para cuadrilla norte, corte especial..."
          className="w-full bg-transparent border-b border-dashed border-slate-300 text-xs text-slate-700 outline-none pb-0.5"
        />
      </td>
      <td className="py-2.5 px-3 text-center">
        <button
          type="button"
          onClick={onQuitar}
          className="w-7 h-7 inline-flex items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          title="Quitar artículo"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}
