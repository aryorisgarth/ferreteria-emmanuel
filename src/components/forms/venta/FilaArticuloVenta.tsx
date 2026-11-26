"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { dinero, etiquetaUnidad, numero } from "@/lib/format";
import type { FilaVenta, OpcionVenta } from "./tipos";

interface FilaArticuloVentaProps {
  fila: FilaVenta;
  indice: number;
  catalogo: OpcionVenta[];
  simboloMoneda: string;
  puedeQuitar: boolean;
  onActualizarFila: (indice: number, delta: Partial<FilaVenta>) => void;
  onQuitarFila: (indice: number) => void;
}

export function FilaArticuloVenta({
  fila,
  indice,
  catalogo,
  simboloMoneda,
  puedeQuitar,
  onActualizarFila,
  onQuitarFila,
}: FilaArticuloVentaProps) {
  const prod = catalogo.find((p) => p.id === fila.productoId);
  const importe = fila.cantidad * fila.precio;

  return (
    <tr className="hover:bg-amber-50/20 transition-colors border-b border-slate-100 text-xs">
      {/* 1. ITEM */}
      <td className="py-3 px-3 text-center font-mono font-bold text-slate-500 w-12">{indice + 1}</td>
      {/* 2. CÓDIGO */}
      <td className="py-3 px-3 whitespace-nowrap w-28">
        <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {prod?.codigo || "—"}
        </span>
      </td>
      {/* 3. MARCA */}
      <td className="py-3 px-3 whitespace-nowrap w-28">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{prod?.marca || "Genérica"}</span>
      </td>

      {/* 4. DESCRIPCIÓN DEL ARTÍCULO */}
      <td className="py-3 px-3 min-w-[240px]">
        {prod ? (
          <div>
            <p className="font-bold text-slate-900 leading-snug">{prod.nombre}</p>
            <input
              type="text"
              value={fila.observacion}
              onChange={(e) => onActualizarFila(indice, { observacion: e.target.value })}
              placeholder="Observación de este material (ej. corte a 3m, entrega en obra)..."
              className="mt-1 h-6 w-full rounded border border-transparent bg-slate-50 px-2 text-[11px] text-slate-600 outline-none hover:border-slate-200 focus:bg-white focus:border-amber-400"
            />
          </div>
        ) : (
          <select
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 font-semibold text-slate-800 outline-none"
            value={fila.productoId}
            onChange={(e) => {
              const nuevo = catalogo.find((p) => p.id === e.target.value);
              onActualizarFila(indice, {
                productoId: e.target.value,
                precio: nuevo?.precio ?? 0,
              });
            }}
          >
            <option value="">Seleccione un material...</option>
            {catalogo.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} — {p.nombre}
              </option>
            ))}
          </select>
        )}
      </td>

      {/* 5. CANTIDAD Y UNIDAD */}
      <td className="py-3 px-3 whitespace-nowrap text-center">
        <div className="inline-flex items-center gap-1.5">
          <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => onActualizarFila(indice, { cantidad: Math.max(1, fila.cantidad - 1) })}
              className="w-6 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30"
            >
              <Minus size={11} />
            </button>
            <input
              type="number"
              min="1"
              step="any"
              value={fila.cantidad}
              onChange={(e) => onActualizarFila(indice, { cantidad: Math.max(0, Number(e.target.value)) })}
              className="w-12 h-7 text-center font-bold font-mono outline-none border-x border-slate-200 bg-white text-xs"
            />
            <button
              type="button"
              onClick={() => onActualizarFila(indice, { cantidad: fila.cantidad + 1 })}
              className="w-6 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100"
            >
              <Plus size={11} />
            </button>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {prod ? etiquetaUnidad(prod.unidadMedida) : "Und"}
          </span>
        </div>
      </td>

      {/* 6. PRECIO UNITARIO */}
      <td className="py-3 px-3 text-right whitespace-nowrap w-28">
        <div className="relative inline-block">
          <input
            type="number"
            step="any"
            value={fila.precio}
            onChange={(e) => onActualizarFila(indice, { precio: Math.max(0, Number(e.target.value)) })}
            className="h-7 w-24 rounded border border-slate-300 bg-white px-2 text-right font-mono text-xs font-bold text-slate-900 outline-none focus:border-amber-400"
          />
        </div>
      </td>

      {/* 7. IMPORTE TOTAL */}
      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-xs font-black text-slate-900 w-32">
        {dinero(importe, simboloMoneda)}
      </td>

      {/* 8. ACCIÓN ELIMINAR */}
      <td className="py-3 px-2 text-center w-10">
        <button
          type="button"
          disabled={!puedeQuitar}
          onClick={() => onQuitarFila(indice)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 disabled:opacity-20 transition"
          title="Quitar este material"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}
