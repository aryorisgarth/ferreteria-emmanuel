"use client";

import { Search } from "lucide-react";
import type { OpcionProducto } from "@/components/forms/CapturaLineas";
import { FilaArticuloSolicitudDocumento, type FilaSolicitudDoc } from "./FilaArticuloSolicitudDocumento";

interface TablaArticulosSolicitudDocumentoProps {
  catalogo: OpcionProducto[];
  filas: FilaSolicitudDoc[];
  busqueda: string;
  setBusqueda: (q: string) => void;
  desplegable: boolean;
  setDesplegable: (abierto: boolean) => void;
  resultadosBusqueda: OpcionProducto[];
  onAgregarArticulo: (art: OpcionProducto) => void;
  onActualizarFila: (idx: number, delta: Partial<FilaSolicitudDoc>) => void;
  onQuitarFila: (idx: number) => void;
}

export function TablaArticulosSolicitudDocumento({
  catalogo,
  filas,
  busqueda,
  setBusqueda,
  desplegable,
  setDesplegable,
  resultadosBusqueda,
  onAgregarArticulo,
  onActualizarFila,
  onQuitarFila,
}: TablaArticulosSolicitudDocumentoProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <label className="block text-xs font-bold text-slate-800 mb-1">Agregar artículo</label>
        <div className="relative">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setDesplegable(true);
            }}
            onFocus={() => setDesplegable(true)}
            placeholder="Escribe el nombre o el código del artículo..."
            className="w-full h-11 border border-slate-300 rounded px-3.5 pl-9 text-xs outline-none focus:border-blue-600 bg-white shadow-2xs"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {desplegable && resultadosBusqueda.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded shadow-lg max-h-60 overflow-y-auto">
            {resultadosBusqueda.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => onAgregarArticulo(prod)}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50/70 border-b border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-blue-700 mr-2">{prod.codigo}</span>
                  <span className="font-semibold text-slate-800">{prod.nombre}</span>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  Stock: <strong className="text-slate-800">{prod.stockActual}</strong>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto border border-slate-300 rounded bg-white">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#eef2f6] border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">ITEM</th>
              <th className="py-2.5 px-3 border-r border-slate-300 w-28">CÓDIGO</th>
              <th className="py-2.5 px-3 border-r border-slate-300 w-32">ECONÓMICA</th>
              <th className="py-2.5 px-3 border-r border-slate-300">DESCRIPCIÓN DEL ARTÍCULO</th>
              <th className="py-2.5 px-3 border-r border-slate-300 text-center w-28">CANTIDAD</th>
              <th className="py-2.5 px-3 border-r border-slate-300 text-center w-20">UNIDAD</th>
              <th className="py-2.5 px-3 border-r border-slate-300">OBSERVACIÓN</th>
              <th className="py-2.5 px-3 text-center w-12">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                  Agrega al menos un artículo desde el buscador de arriba.
                </td>
              </tr>
            ) : (
              filas.map((fila, idx) => {
                const prod = catalogo.find((p) => p.id === fila.productoId);
                return (
                  <FilaArticuloSolicitudDocumento
                    key={`${fila.productoId}-${idx}`}
                    indice={idx}
                    fila={fila}
                    articulo={prod}
                    onActualizar={(delta) => onActualizarFila(idx, delta)}
                    onQuitar={() => onQuitarFila(idx)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
