"use client";

import React from "react";
import { Layers } from "lucide-react";
import type { TemaConfig } from "@/lib/theme";

interface TemaShowcaseProps {
  temaActual: TemaConfig;
}

export function TemaShowcase({ temaActual }: TemaShowcaseProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-slate-600" />
          <h3 className="text-xs font-bold text-slate-900">
            Demostración de Componentes con el Tema Activo ({temaActual.nombre})
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Contraste y legibilidad
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-md border border-slate-200 bg-slate-50 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Botón de Acción POS
          </span>
          <div>
            <button
              type="button"
              className="w-full h-8 rounded-md font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              style={{
                backgroundColor: temaActual.colorHex,
                color: temaActual.contrastHex,
              }}
            >
              <span>Cobrar Ticket (F9)</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400">Contraste de alto impacto.</p>
        </div>

        <div className="p-3 rounded-md border border-slate-200 bg-slate-50 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Campo con Enfoque
          </span>
          <input
            type="text"
            readOnly
            value="CEM-001 · Cemento Canal Gris"
            className="w-full h-8 rounded-md border bg-white px-2.5 text-xs font-semibold text-slate-800 outline-none"
            style={{
              borderColor: temaActual.colorHex,
              boxShadow: `0 0 0 2px ${temaActual.ringRgba}`,
            }}
          />
          <p className="text-[10px] text-slate-400">Anillo dinámico semántico.</p>
        </div>

        <div className="p-3 rounded-md border border-slate-200 bg-slate-50 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Badge y Tarjeta Resumen
          </span>
          <div
            className="p-2 rounded-md border flex items-center justify-between"
            style={{
              backgroundColor: temaActual.accentLightHex,
              borderColor: temaActual.accentBorderHex,
            }}
          >
            <span className="text-xs font-bold text-slate-900">Total Facturado</span>
            <span
              className="text-xs font-mono font-black px-2 py-0.5 rounded"
              style={{
                backgroundColor: temaActual.colorHex,
                color: temaActual.contrastHex,
              }}
            >
              C$ 4,500.00
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Resaltado armónico en tarjetas.</p>
        </div>
      </div>
    </div>
  );
}
