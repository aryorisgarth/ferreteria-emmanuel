"use client";

import { Plus } from "lucide-react";
import { dinero } from "@/lib/format";
import type { FilaVenta, OpcionVenta } from "./tipos";
import { BuscadorRapidoArticulo } from "./BuscadorRapidoArticulo";
import { FilaArticuloVenta } from "./FilaArticuloVenta";

interface TablaArticulosVentaFormProps {
  catalogo: OpcionVenta[];
  filas: FilaVenta[];
  busquedaArticulo: string;
  setBusquedaArticulo: (val: string) => void;
  desplegableAbierto: boolean;
  setDesplegableAbierto: (val: boolean) => void;
  resultadosBusqueda: OpcionVenta[];
  onAgregarArticulo: (art: OpcionVenta) => void;
  onActualizarFila: (indice: number, delta: Partial<FilaVenta>) => void;
  onQuitarFila: (indice: number) => void;
  onAgregarRenglonVacio: () => void;
  subtotal: number;
  iva: number;
  total: number;
  porcentajeImpuesto: number;
  simboloMoneda: string;
  modo: "cotizacion" | "factura";
}

export function TablaArticulosVentaForm(props: TablaArticulosVentaFormProps) {
  const {
    catalogo, filas, busquedaArticulo, setBusquedaArticulo,
    desplegableAbierto, setDesplegableAbierto, resultadosBusqueda,
    onAgregarArticulo, onActualizarFila, onQuitarFila, onAgregarRenglonVacio,
    subtotal, iva, total, porcentajeImpuesto, simboloMoneda, modo,
  } = props;
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      {/* 1. Buscador Superior Destacado: "Agregar artículo" */}
      <div className="space-y-1.5 pb-2">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Agregar artículo al presupuesto
        </label>
        <BuscadorRapidoArticulo
          busquedaArticulo={busquedaArticulo}
          setBusquedaArticulo={setBusquedaArticulo}
          desplegableAbierto={desplegableAbierto}
          setDesplegableAbierto={setDesplegableAbierto}
          resultadosBusqueda={resultadosBusqueda}
          onAgregarArticulo={onAgregarArticulo}
          simboloMoneda={simboloMoneda}
        />
      </div>

      {/* 2. Tabla de Materiales con Formato de Documento Oficial */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3 text-center w-12">Item</th>
              <th className="py-3 px-3 w-28">Código</th>
              <th className="py-3 px-3 w-28">Marca</th>
              <th className="py-3 px-3 min-w-[240px]">Descripción del Artículo</th>
              <th className="py-3 px-3 text-center w-40">Cantidad / Unidad</th>
              <th className="py-3 px-3 text-right w-28">Precio Unit. ({simboloMoneda})</th>
              <th className="py-3 px-3 text-right w-32">Importe ({simboloMoneda})</th>
              <th className="py-3 px-2 w-10 text-center" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filas.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs font-semibold text-slate-400">
                  Agrega al menos un artículo desde el buscador de arriba.
                </td>
              </tr>
            ) : (
              filas.map((fila, i) => (
                <FilaArticuloVenta
                  key={i}
                  fila={fila}
                  indice={i}
                  catalogo={catalogo}
                  simboloMoneda={simboloMoneda}
                  puedeQuitar={filas.length > 1}
                  onActualizarFila={onActualizarFila}
                  onQuitarFila={onQuitarFila}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Botón para Renglón y Resumen de Totales */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onAgregarRenglonVacio}
          className="btn btn-linea h-9 text-xs font-bold gap-1.5 shadow-2xs"
        >
          <Plus size={14} />
          <span>Agregar Renglón Manual</span>
        </button>

        <div className="w-full md:w-80 rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Neto:</span>
            <span className="font-mono font-bold text-slate-800">{dinero(subtotal, simboloMoneda)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>I.V.A. ({porcentajeImpuesto}%):</span>
            <span className="font-mono font-bold text-slate-800">{dinero(iva, simboloMoneda)}</span>
          </div>
          <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-1.5 text-slate-900">
            <span>Total {modo === "cotizacion" ? "Cotizado" : "Facturado"}:</span>
            <span className="font-mono text-amber-700">{dinero(total, simboloMoneda)}</span>
          </div>
        </div>
      </div>

      {/* 4. Bloque Formal de Firmas */}
      <div className="pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs text-slate-500">
        <div>
          <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
          <p className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Recibe</p>
          <p className="text-[11px] text-slate-400">Nombre / Firma Cliente</p>
        </div>
        <div>
          <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
          <p className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
            {modo === "cotizacion" ? "Cotiza" : "Entrega"}
          </p>
          <p className="text-[11px] text-slate-400">Vendedor / Responsable</p>
        </div>
        <div>
          <div className="border-b border-slate-300 w-3/4 mx-auto mb-1.5" />
          <p className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Autoriza</p>
          <p className="text-[11px] text-slate-400">Gerencia / Administración</p>
        </div>
      </div>
    </div>
  );
}
