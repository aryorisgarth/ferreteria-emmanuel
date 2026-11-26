"use client";

import { CreditCard, Receipt, Lock } from "lucide-react";
import { dinero, numero } from "@/lib/format";
import type { ItemCarritoPOS } from "./tipos";
import type { ConfiguracionSistema } from "@/lib/config";

interface TicketVentaProps {
  items: ItemCarritoPOS[];
  subtotal: number;
  iva: number;
  total: number;
  config: ConfiguracionSistema;
  turnoUsuario?: string;
  clienteNombre: string;
  cotizacionActiva?: ItemCarritoPOS;
  onCobrar: () => void;
  disabled?: boolean;
}

export function TicketVenta({
  items,
  subtotal,
  iva,
  total,
  config,
  turnoUsuario = "Cajero",
  clienteNombre,
  cotizacionActiva,
  onCobrar,
  disabled = false,
}: TicketVentaProps) {
  const simboloMoneda = config?.moneda?.simbolo || "C$";
  const porcentajeIva = config?.impuesto?.porcentaje ?? 15;
  const nombreIva = config?.impuesto?.nombre || "I.V.A.";

  return (
    <div className="bg-white rounded-md border border-slate-300 shadow-sm flex flex-col overflow-hidden">
      {/* Encabezado Estilo Minifactura Comercial */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 text-center space-y-0.5">
        <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          {config?.empresa?.bodega || "COMPROBANTE COMERCIAL"}
        </p>
        <h3 className="text-sm font-black text-slate-900 tracking-tight">
          {config?.empresa?.nombre || "FERRETERÍA EMMANUEL"}
        </h3>
        <p className="text-[11px] font-mono text-slate-600">RUC: {config?.empresa?.ruc || "J0310000000000"}</p>
        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/80 mt-1.5">
          <span>{new Date().toLocaleDateString("es-NI")}</span>
          <span className="font-semibold text-slate-700">Ticket Preliminar</span>
          <span>Caj: {turnoUsuario}</span>
        </div>

        {cotizacionActiva && (
          <div className="mt-1.5 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-left text-[11px]">
            <div className="flex items-center justify-between text-amber-900 font-bold">
              <span className="inline-flex items-center gap-1">
                <Lock size={10} />
                Cotización: {cotizacionActiva.cotizacionNumero || cotizacionActiva.cotizacionId} (v{cotizacionActiva.cotizacionVersion || 1})
              </span>
            </div>
            <p className="text-slate-600 truncate text-[10px]">Cliente: {clienteNombre}</p>
          </div>
        )}
      </div>

      {/* Cuerpo del Ticket: Vista de Lectura Compacta */}
      <div className="p-3 min-h-[160px] max-h-[calc(100vh-23rem)] overflow-y-auto space-y-1.5 text-xs divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Receipt size={24} className="mx-auto mb-1 opacity-25" />
            <p className="text-[11px] font-semibold text-slate-500">Ticket en espera de artículos</p>
          </div>
        ) : (
          items.map((it) => {
            const precio = it.precioPersonalizado !== undefined ? it.precioPersonalizado : it.producto.precio;
            const desc = it.descuentoUnitario || 0;
            const precioEfectivo = Math.max(0, precio - desc);
            const importe = it.cantidad * precioEfectivo;

            return (
              <div key={`${it.producto.id}-${it.cotizacionItemId || "dir"}`} className="pt-1.5 first:pt-0 flex justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 leading-tight truncate">{it.producto.nombre}</p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {numero(it.cantidad)} x {dinero(precioEfectivo, simboloMoneda)}
                  </p>
                </div>
                <span className="font-mono font-bold text-slate-900 shrink-0">
                  {dinero(importe, simboloMoneda)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Bloque Fijo de Resumen Fiscal y Totales */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 space-y-1 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal:</span>
          <span className="font-mono font-semibold text-slate-800">{dinero(subtotal, simboloMoneda)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>{nombreIva} ({porcentajeIva}%):</span>
          <span className="font-mono font-semibold text-slate-800">{dinero(iva, simboloMoneda)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200">
          <span className="text-sm font-black text-slate-900 uppercase">Total a Pagar:</span>
          <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
            {dinero(total, simboloMoneda)}
          </span>
        </div>
      </div>

      {/* Acción Principal: Cobrar */}
      <div className="p-2.5 border-t border-slate-200 bg-white">
        <button
          type="button"
          onClick={onCobrar}
          disabled={items.length === 0 || disabled}
          className="btn btn-amarillo w-full h-11 text-sm font-black uppercase tracking-wider gap-2 shadow-sm disabled:opacity-40"
        >
          <CreditCard size={18} />
          <span>Cobrar [F12]</span>
        </button>
      </div>
    </div>
  );
}
