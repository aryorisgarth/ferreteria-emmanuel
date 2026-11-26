"use client";

import { Banknote, CreditCard, DollarSign, Users } from "lucide-react";
import { dinero } from "@/lib/format";
import type { FormaPagoPOS } from "./tipos";

interface CamposMetodoPagoProps {
  pago: FormaPagoPOS;
  onCambiarPago: (pago: FormaPagoPOS) => void;
  efectivoRecibido: number | "";
  onCambiarEfectivoRecibido: (val: number | "") => void;
  bancoDestino: string;
  onCambiarBancoDestino: (val: string) => void;
  referenciaBancaria: string;
  onCambiarReferenciaBancaria: (val: string) => void;
  montoEfectivoMixto: number | "";
  onCambiarMontoEfectivoMixto: (val: number | "") => void;
  montoTransferenciaMixto: number | "";
  onCambiarMontoTransferenciaMixto: (val: number | "") => void;
  cambio: number;
  simboloMoneda: string;
}

export function CamposMetodoPago({
  pago,
  onCambiarPago,
  efectivoRecibido,
  onCambiarEfectivoRecibido,
  bancoDestino,
  onCambiarBancoDestino,
  referenciaBancaria,
  onCambiarReferenciaBancaria,
  montoEfectivoMixto,
  onCambiarMontoEfectivoMixto,
  montoTransferenciaMixto,
  onCambiarMontoTransferenciaMixto,
  cambio,
  simboloMoneda,
}: CamposMetodoPagoProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {[
          { id: "EFECTIVO", label: "Efectivo", icon: DollarSign },
          { id: "TRANSFERENCIA", label: "Transferencia", icon: CreditCard },
          { id: "MIXTO", label: "Mixto", icon: Banknote },
          { id: "CREDITO", label: "Fiado / Crédito", icon: Users },
        ].map((m) => {
          const Icon = m.icon;
          const activo = pago === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onCambiarPago(m.id as FormaPagoPOS)}
              className={`h-9 px-2 rounded border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activo ? "bg-slate-900 text-white border-slate-900 shadow-2xs" : "bg-white text-slate-700 hover:bg-slate-100 border-slate-300"
              }`}
            >
              <Icon size={13} className={activo ? "text-amber-400" : "text-slate-400"} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {pago === "EFECTIVO" && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Efectivo Recibido</label>
            <input type="number" step="any" min={0} required value={efectivoRecibido} onChange={(e) => onCambiarEfectivoRecibido(parseFloat(e.target.value) || "")} placeholder="C$ 0.00" className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 font-mono font-bold text-slate-900 outline-none focus:border-brand-yellow" autoFocus />
          </div>
          <div>
            <span className="block font-bold text-slate-700 mb-1">Cambio / Vuelto</span>
            <p className="h-8 flex items-center px-2.5 rounded bg-emerald-50 border border-emerald-200 font-mono font-bold text-emerald-800 text-sm">
              {dinero(cambio, simboloMoneda)}
            </p>
          </div>
        </div>
      )}

      {pago === "TRANSFERENCIA" && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Banco Destino</label>
            <select value={bancoDestino} onChange={(e) => onCambiarBancoDestino(e.target.value)} className="h-8 w-full rounded border border-slate-300 bg-white px-2 font-semibold text-slate-800 outline-none focus:border-brand-yellow">
              <option value="BAC Credomatic">BAC Credomatic</option>
              <option value="Banpro">Banpro</option>
              <option value="Banco LAFISE Bancentro">LAFISE Bancentro</option>
              <option value="Ficohsa">Ficohsa</option>
              <option value="BDF">BDF</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">No. Referencia / Voucher *</label>
            <input type="text" required value={referenciaBancaria} onChange={(e) => onCambiarReferenciaBancaria(e.target.value)} placeholder="Ej. REF-883719" className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 font-mono font-bold text-slate-900 outline-none focus:border-brand-yellow" />
          </div>
        </div>
      )}

      {pago === "MIXTO" && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Efectivo</label>
              <input type="number" step="any" value={montoEfectivoMixto} onChange={(e) => onCambiarMontoEfectivoMixto(parseFloat(e.target.value) || "")} className="h-8 w-full rounded border border-slate-300 bg-white px-2 font-mono font-bold text-slate-900 outline-none focus:border-brand-yellow" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Transferencia</label>
              <input type="number" step="any" value={montoTransferenciaMixto} onChange={(e) => onCambiarMontoTransferenciaMixto(parseFloat(e.target.value) || "")} className="h-8 w-full rounded border border-slate-300 bg-white px-2 font-mono font-bold text-slate-900 outline-none focus:border-brand-yellow" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Banco Destino</label>
              <select value={bancoDestino} onChange={(e) => onCambiarBancoDestino(e.target.value)} className="h-8 w-full rounded border border-slate-300 bg-white px-2 font-semibold text-slate-800 outline-none focus:border-brand-yellow">
                <option value="BAC Credomatic">BAC Credomatic</option>
                <option value="Banpro">Banpro</option>
                <option value="Banco LAFISE Bancentro">LAFISE Bancentro</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Voucher *</label>
              <input type="text" required value={referenciaBancaria} onChange={(e) => onCambiarReferenciaBancaria(e.target.value)} placeholder="No. Referencia" className="h-8 w-full rounded border border-slate-300 bg-white px-2 font-mono font-bold text-slate-900 outline-none focus:border-brand-yellow" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
