"use client";

import { Minus, Plus, ShoppingCart, Trash2, Lock } from "lucide-react";
import { dinero, etiquetaUnidad } from "@/lib/format";
import type { ItemCarritoPOS } from "./tipos";

interface TablaArticulosVentaProps {
  items: ItemCarritoPOS[];
  simboloMoneda: string;
  onCambiarCantidad: (id: string, delta: number, cotizacionItemId?: string) => void;
  onFijarCantidad: (id: string, cant: number, cotizacionItemId?: string) => void;
  onEliminar: (id: string, cotizacionItemId?: string) => void;
  onLimpiarCarrito: () => void;
  onAbrirCatalogo: () => void;
}

export function TablaArticulosVenta({
  items,
  simboloMoneda,
  onCambiarCantidad,
  onFijarCantidad,
  onEliminar,
  onLimpiarCarrito,
  onAbrirCatalogo,
}: TablaArticulosVentaProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-md border border-slate-200 p-8 text-center min-h-[380px] flex flex-col items-center justify-center shadow-2xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
          <ShoppingCart size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No hay artículos seleccionados</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          El ticket está listo. Selecciona una categoría arriba o usa el buscador <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px] font-bold text-slate-700">F2</kbd> para agregar artículos a la venta.
        </p>
        <button
          type="button"
          onClick={onAbrirCatalogo}
          className="btn btn-amarillo h-8 px-4 text-xs font-bold gap-1.5 mt-4 shadow-2xs"
        >
          <span>Explorar Catálogo</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto min-h-[340px] max-h-[calc(100vh-17rem)] overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
            <tr>
              <th className="py-2 px-3">Código</th>
              <th className="py-2 px-3">Descripción</th>
              <th className="py-2 px-2 text-center">Unidad</th>
              <th className="py-2 px-3 text-center">Cantidad</th>
              <th className="py-2 px-3 text-right">Precio Unit.</th>
              <th className="py-2 px-3 text-right">Importe</th>
              <th className="py-2 px-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const precio = item.precioPersonalizado !== undefined ? item.precioPersonalizado : item.producto.precio;
              const desc = item.descuentoUnitario || 0;
              const precioEfectivo = Math.max(0, precio - desc);
              const importe = item.cantidad * precioEfectivo;

              return (
                <tr key={`${item.producto.id}-${item.cotizacionItemId || "directo"}`} className="hover:bg-slate-50/70 transition">
                  <td className="py-2 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                    {item.producto.codigo}
                  </td>
                  <td className="py-2 px-3">
                    <p className="font-semibold text-slate-900 leading-tight">{item.producto.nombre}</p>
                    {item.esCotizacion && (
                      <span className="inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                        <Lock size={9} />
                        Cotización {item.cotizacionNumero || item.cotizacionId} (Precio congelado)
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-500 whitespace-nowrap">
                    {etiquetaUnidad(item.producto.unidadMedida)}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => onCambiarCantidad(item.producto.id, -1, item.cotizacionItemId)} className="h-6 w-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold" title="Restar 1">
                        <Minus size={11} />
                      </button>
                      <input type="number" min="0.001" step="any" value={item.cantidad} onChange={(e) => onFijarCantidad(item.producto.id, parseFloat(e.target.value) || 0, item.cotizacionItemId)} className="h-6 w-14 rounded border border-slate-300 text-center font-mono font-bold text-xs text-slate-900 outline-none focus:border-brand-yellow" />
                      <button type="button" onClick={() => onCambiarCantidad(item.producto.id, 1, item.cotizacionItemId)} className="h-6 w-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold" title="Sumar 1">
                        <Plus size={11} />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {dinero(precioEfectivo, simboloMoneda)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {dinero(importe, simboloMoneda)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onEliminar(item.producto.id, item.cotizacionItemId)}
                      className="h-6 w-6 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                      title="Eliminar artículo de la venta"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-3 py-2 text-xs">
        <span className="text-slate-500 font-medium">
          Artículos en ticket: <strong className="text-slate-800">{items.length}</strong> (
          {items.reduce((s, i) => s + i.cantidad, 0)} unidades)
        </span>
        <button
          type="button"
          onClick={onLimpiarCarrito}
          className="text-[11px] font-semibold text-rose-600 hover:underline"
        >
          Vaciar lista
        </button>
      </div>
    </div>
  );
}
