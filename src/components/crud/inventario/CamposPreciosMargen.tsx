"use client";

import { useMemo } from "react";

interface CamposPreciosMargenProps {
  costoModal: number;
  setCostoModal: (costo: number) => void;
  precioModal: number;
  setPrecioModal: (precio: number) => void;
  esAdmin: boolean;
}

export function CamposPreciosMargen({
  costoModal,
  setCostoModal,
  precioModal,
  setPrecioModal,
  esAdmin,
}: CamposPreciosMargenProps) {
  const margenEstimado = useMemo(() => {
    if (precioModal <= 0 || costoModal <= 0) return null;
    const m = ((precioModal - costoModal) / precioModal) * 100;
    return Math.round(m * 10) / 10;
  }, [costoModal, precioModal]);

  return (
    <div className={`grid grid-cols-1 ${esAdmin ? "sm:grid-cols-2" : ""} gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200`}>
      {esAdmin && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Costo Base de Adquisición (C$)
          </label>
          <input
            type="number"
            step="0.01"
            name="costo"
            value={costoModal || ""}
            onChange={(e) => setCostoModal(Number(e.target.value))}
            placeholder="0.00"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Precio de Venta al Público (C$) <span className="text-amber-500">*</span>
          </label>
          {esAdmin && margenEstimado !== null && (
            <span
              className={`text-[11px] font-bold ${
                margenEstimado > 20 ? "text-emerald-600" : margenEstimado > 0 ? "text-amber-600" : "text-rose-600"
              }`}
            >
              Margen: {margenEstimado}%
            </span>
          )}
        </div>
        <input
          type="number"
          step="0.01"
          name="precio"
          required
          value={precioModal || ""}
          onChange={(e) => setPrecioModal(Number(e.target.value))}
          placeholder="0.00"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
        />
      </div>
    </div>
  );
}
