"use client";

import { AlertTriangle } from "lucide-react";
import type { ProductoVista } from "@/lib/types";

interface AlertaCostoReferenciaAjusteProps {
  signoEfectivo: number;
  productoSeleccionado: ProductoVista | undefined;
  ajusteCostoReferencia: number;
  setAjusteCostoReferencia: (c: number) => void;
}

export function AlertaCostoReferenciaAjuste({
  signoEfectivo,
  productoSeleccionado,
  ajusteCostoReferencia,
  setAjusteCostoReferencia,
}: AlertaCostoReferenciaAjusteProps) {
  if (signoEfectivo !== 1 || !productoSeleccionado || productoSeleccionado.costo > 0) {
    return null;
  }

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
      <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
        <AlertTriangle size={15} /> Sin costo base registrado
      </div>
      <p className="text-[11px] text-amber-800">
        Especifique un costo de adquisición de referencia mayor a cero para ingresar inventario.
      </p>
      <input
        type="number"
        step="0.01"
        min="0.01"
        name="costoReferencia"
        value={ajusteCostoReferencia || ""}
        onChange={(e) => setAjusteCostoReferencia(Number(e.target.value))}
        required
        placeholder="Costo Referencia C$"
        className="h-9 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm font-mono text-slate-900 outline-none"
      />
    </div>
  );
}
