"use client";

import { UserPlus, Building2 } from "lucide-react";
import type { Cliente } from "@/lib/types";
import type { FormaPagoFactura } from "./tipos";

interface DatosGeneralesVentaProps {
  modo: "cotizacion" | "factura";
  simboloMoneda: string;
  porcentajeImpuesto: number;
  listaClientes: Cliente[];
  clienteNombre: string;
  setClienteNombre: (nombre: string) => void;
  setClienteId: (id: string) => void;
  fecha: string;
  formaPago: FormaPagoFactura;
  setFormaPago: (forma: FormaPagoFactura) => void;
  onAbrirModalCliente: () => void;
}

export function DatosGeneralesVenta({
  modo,
  simboloMoneda,
  porcentajeImpuesto,
  listaClientes,
  clienteNombre,
  setClienteNombre,
  setClienteId,
  fecha,
  formaPago,
  setFormaPago,
  onAbrirModalCliente,
}: DatosGeneralesVentaProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      {/* 1. Encabezado Oficial del Documento */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight uppercase">
              {modo === "cotizacion" ? "Cotización y Presupuesto de Materiales" : "Factura Comercial de Venta"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Ferretería Emmanuel · Mostrador & Bodega Central</p>
          </div>
        </div>
        <div className="text-left sm:text-right font-mono text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          <p className="font-bold">FECHA: <span className="text-slate-900">{fecha}</span></p>
          <p className="text-[11px] text-slate-500">MONEDA: {simboloMoneda} · IVA: {porcentajeImpuesto}%</p>
        </div>
      </div>

      {/* 2. Cliente y Destinatario / Obra */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-black uppercase tracking-wider text-slate-800">
              Cliente / Razón Social <span className="text-amber-500">*</span>
            </label>
            <button
              type="button"
              onClick={onAbrirModalCliente}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
            >
              <UserPlus size={13} /> + Nuevo Cliente
            </button>
          </div>
          <input
            className="h-10 w-full rounded-xl border border-slate-300 px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/40 transition"
            name="cliente"
            list="clientes-lista"
            required
            value={clienteNombre}
            onChange={(e) => {
              setClienteNombre(e.target.value);
              const hallado = listaClientes.find((c) => c.nombre.toLowerCase() === e.target.value.toLowerCase());
              setClienteId(hallado?.id ?? "");
            }}
            placeholder="Ej. Ing. Carlos Mendoza / Constructora El Sol"
          />
          <datalist id="clientes-lista">
            {listaClientes.map((c) => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
            Destinatario / Obra o Proyecto
          </label>
          <input
            className="h-10 w-full rounded-xl border border-slate-300 px-3.5 text-xs font-medium text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/40 transition"
            name={modo === "cotizacion" ? "condicionesComerciales" : "notas"}
            placeholder="Ej. Atención: Oficina Central / Biblioteca Médica / Obra Las Colinas"
          />
        </div>
      </div>

      {/* 3. Fechas y Condiciones */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 pt-1">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
            Fecha de Emisión <span className="text-amber-500">*</span>
          </label>
          <input
            type="date" name="fecha" defaultValue={fecha} required
            className="h-10 w-full rounded-xl border border-slate-300 px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
            {modo === "cotizacion" ? "Vigencia / Fecha de Entrega" : "Condición de Pago"}
          </label>
          {modo === "cotizacion" ? (
            <input
              type="date" name="fechaVencimiento"
              className="h-10 w-full rounded-xl border border-slate-300 px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-amber-400"
              defaultValue={new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]}
            />
          ) : (
            <select
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
              name="formaPago" value={formaPago} onChange={(e) => setFormaPago(e.target.value as FormaPagoFactura)}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="TARJETA">Tarjeta de Débito/Crédito</option>
              <option value="CREDITO">Crédito / Por Cobrar</option>
            </select>
          )}
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">Observaciones o Términos</label>
          <input
            className="h-10 w-full rounded-xl border border-slate-300 px-3.5 text-xs font-medium text-slate-800 outline-none focus:border-amber-400"
            name="notas" placeholder="Precios válidos por 15 días / Entrega sujeta a stock"
          />
        </div>
      </div>
    </div>
  );
}
