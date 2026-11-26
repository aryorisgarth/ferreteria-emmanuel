"use client";

import { dinero, etiquetaUnidad, numero } from "@/lib/format";
import type { OpcionVenta } from "../venta/tipos";
import { FilaArticuloCompraDocumento, type FilaCompraDoc } from "./FilaArticuloCompraDocumento";

interface TablaArticulosCompraDocumentoProps {
  catalogo: OpcionVenta[];
  filas: FilaCompraDoc[];
  busquedaArticulo: string;
  setBusquedaArticulo: (val: string) => void;
  desplegableAbierto: boolean;
  setDesplegableAbierto: (val: boolean) => void;
  resultadosBusqueda: OpcionVenta[];
  onAgregarArticulo: (art: OpcionVenta) => void;
  onActualizarFila: (indice: number, delta: Partial<FilaCompraDoc>) => void;
  onQuitarFila: (indice: number) => void;
  subtotal: number;
  iva: number;
  total: number;
  simboloMoneda: string;
  porcentajeImpuesto: number;
}

export function TablaArticulosCompraDocumento({
  catalogo,
  filas,
  busquedaArticulo,
  setBusquedaArticulo,
  desplegableAbierto,
  setDesplegableAbierto,
  resultadosBusqueda,
  onAgregarArticulo,
  onActualizarFila,
  onQuitarFila,
  subtotal,
  iva,
  total,
  simboloMoneda,
  porcentajeImpuesto,
}: TablaArticulosCompraDocumentoProps) {
  return (
    <div className="space-y-4">
      {/* 1. Buscador Superior Idéntico al formato */}
      <div className="relative">
        <label className="block text-xs font-bold text-slate-800 mb-1">Agregar artículo</label>
        <input
          type="text"
          value={busquedaArticulo}
          onChange={(e) => {
            setBusquedaArticulo(e.target.value);
            setDesplegableAbierto(true);
          }}
          onFocus={() => setDesplegableAbierto(true)}
          placeholder="Escribe el nombre o el código del material para ingresarlo a la compra..."
          className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-600 transition"
        />

        {desplegableAbierto && resultadosBusqueda.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded border border-slate-300 bg-white shadow-xl divide-y divide-slate-100">
            {resultadosBusqueda.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => {
                  onAgregarArticulo(prod);
                  setDesplegableAbierto(false);
                }}
                className="w-full p-2.5 text-left text-xs hover:bg-slate-100 transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{prod.nombre}</p>
                  <p className="font-mono text-[11px] text-slate-500">
                    {prod.codigo} · {prod.marca || "Genérica"} · Stock actual: {numero(prod.stockActual)} {etiquetaUnidad(prod.unidadMedida)}
                  </p>
                </div>
                <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                  Precio Venta Ref: {dinero(prod.precio, simboloMoneda)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Tabla con Bordes Cuadrados Exactos del formato */}
      <div className="overflow-x-auto border border-slate-300">
        <table className="w-full text-left border-collapse bg-white">
          <thead className="bg-[#eef2f6] text-slate-800 text-[11px] font-bold uppercase tracking-wider border-b border-slate-300">
            <tr>
              <th className="border-r border-slate-300 py-2 px-2 text-center w-12">Item</th>
              <th className="border-r border-slate-300 py-2 px-2 text-center w-28">Código</th>
              <th className="border-r border-slate-300 py-2 px-2 text-center w-28">Económica</th>
              <th className="border-r border-slate-300 py-2 px-3 text-center min-w-[260px]">Descripción del Artículo</th>
              <th className="border-r border-slate-300 py-2 px-2 text-center w-20">Cantidad</th>
              <th className="border-r border-slate-300 py-2 px-2 text-center w-20">Unidad</th>
              <th className="border-r border-slate-300 py-2 px-2 text-center w-28">Costo Unit.</th>
              <th className="border-r border-slate-300 py-2 px-3 text-center w-32">Importe</th>
              <th className="border-r border-slate-300 py-2 px-2 text-center min-w-[160px]">Observación</th>
              <th className="py-2 px-2 text-center w-10" />
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-xs text-slate-500 font-medium">
                  Agrega al menos un artículo desde el buscador de arriba.
                </td>
              </tr>
            ) : (
              filas.map((fila, i) => (
                <FilaArticuloCompraDocumento
                  key={i}
                  fila={fila}
                  indice={i}
                  catalogo={catalogo}
                  simboloMoneda={simboloMoneda}
                  onActualizarFila={onActualizarFila}
                  onQuitarFila={onQuitarFila}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Desglose de Totales de Factura Compra */}
      {filas.length > 0 && (
        <div className="flex justify-end pt-2">
          <div className="w-72 bg-slate-50 border border-slate-300 p-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal Mercancía:</span>
              <span className="font-mono font-bold">{dinero(subtotal, simboloMoneda)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>I.V.A. ({porcentajeImpuesto}%):</span>
              <span className="font-mono font-bold">{dinero(iva, simboloMoneda)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-300 pt-1 text-slate-900">
              <span>Total Factura Compra:</span>
              <span className="font-mono text-blue-800">{dinero(total, simboloMoneda)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
