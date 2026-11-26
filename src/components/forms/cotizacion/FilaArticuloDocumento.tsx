"use client";

import { Trash2 } from "lucide-react";
import { dinero, etiquetaUnidad } from "@/lib/format";
import type { FilaVenta, OpcionVenta } from "../venta/tipos";

interface FilaArticuloDocumentoProps {
  fila: FilaVenta;
  indice: number;
  catalogo: OpcionVenta[];
  simboloMoneda: string;
  onActualizarFila: (indice: number, delta: Partial<FilaVenta>) => void;
  onQuitarFila: (indice: number) => void;
}

export function FilaArticuloDocumento({
  fila,
  indice,
  catalogo,
  simboloMoneda,
  onActualizarFila,
  onQuitarFila,
}: FilaArticuloDocumentoProps) {
  const prod = catalogo.find((p) => p.id === fila.productoId);
  const importe = fila.cantidad * fila.precio;

  return (
    <tr className="hover:bg-slate-50/60 transition text-xs border-b border-slate-300">
      {/* 1. ITEM */}
      <td className="border-r border-slate-300 py-2 px-2 text-center font-bold text-slate-700 w-12">
        {indice + 1}
      </td>

      {/* 2. CÓDIGO */}
      <td className="border-r border-slate-300 py-2 px-2 text-center font-mono font-bold text-slate-800 whitespace-nowrap w-28">
        {prod?.codigo || "—"}
      </td>

      {/* 3. MARCA / ECONÓMICA */}
      <td className="border-r border-slate-300 py-2 px-2 text-center font-bold text-slate-700 uppercase whitespace-nowrap w-28">
        {prod?.marca || "GENÉRICA"}
      </td>

      {/* 4. DESCRIPCIÓN DEL ARTÍCULO */}
      <td className="border-r border-slate-300 py-2 px-3 font-semibold text-slate-900 min-w-[260px]">
        {prod?.nombre || "Material seleccionado"}
      </td>

      {/* 5. CANTIDAD */}
      <td className="border-r border-slate-300 py-1.5 px-2 text-center w-20">
        <input
          type="number"
          min="1"
          step="any"
          value={fila.cantidad}
          onChange={(e) => onActualizarFila(indice, { cantidad: Math.max(0, Number(e.target.value)) })}
          className="h-7 w-16 rounded border border-slate-300 text-center font-bold text-xs outline-none focus:border-blue-600 bg-white"
        />
      </td>

      {/* 6. UNIDAD */}
      <td className="border-r border-slate-300 py-2 px-2 text-center font-bold text-slate-600 whitespace-nowrap w-20">
        {prod ? etiquetaUnidad(prod.unidadMedida) : "Und"}
      </td>

      {/* 7. PRECIO UNITARIO */}
      <td className="border-r border-slate-300 py-1.5 px-2 text-right w-28 whitespace-nowrap">
        <input
          type="number"
          step="any"
          value={fila.precio}
          onChange={(e) => onActualizarFila(indice, { precio: Math.max(0, Number(e.target.value)) })}
          className="h-7 w-22 rounded border border-slate-300 px-2 text-right font-mono font-bold text-xs outline-none focus:border-blue-600 bg-white"
        />
      </td>

      {/* 8. IMPORTE TOTAL */}
      <td className="border-r border-slate-300 py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap w-32">
        {dinero(importe, simboloMoneda)}
      </td>

      {/* 9. OBSERVACIÓN */}
      <td className="border-r border-slate-300 py-1.5 px-2 min-w-[160px]">
        <input
          type="text"
          value={fila.observacion}
          onChange={(e) => onActualizarFila(indice, { observacion: e.target.value })}
          placeholder="Nota u observación..."
          className="h-7 w-full border border-slate-200 rounded px-2 text-xs text-slate-700 outline-none focus:border-blue-600 bg-white"
        />
      </td>

      {/* 10. ACCIÓN ELIMINAR */}
      <td className="py-2 px-2 text-center w-10">
        <button
          type="button"
          onClick={() => onQuitarFila(indice)}
          className="text-slate-400 hover:text-rose-600 transition p-1"
          title="Quitar artículo"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}
