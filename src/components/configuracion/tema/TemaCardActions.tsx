"use client";

import React from "react";
import { Check, Eye, X } from "lucide-react";
import type { TemaConfig, TemaId } from "@/lib/theme";

interface TemaCardActionsProps {
  tema: TemaConfig;
  esElGuardado: boolean;
  esEnVistaPrevia: boolean;
  onSeleccionar: (id: TemaId) => void;
  onGuardar: (id: TemaId) => void;
  onCancelarPreview?: () => void;
}

export function TemaCardActions({
  tema,
  esElGuardado,
  esEnVistaPrevia,
  onSeleccionar,
  onGuardar,
  onCancelarPreview,
}: TemaCardActionsProps) {
  if (esElGuardado) {
    return (
      <div className="flex items-center justify-center py-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50/60 rounded-lg border border-emerald-100">
        <Check size={12} className="mr-1" /> Tema activo
      </div>
    );
  }

  if (esEnVistaPrevia) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancelarPreview?.();
          }}
          className="flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
        >
          <X size={12} />
          Cancelar
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGuardar(tema.id);
          }}
          className="flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
          style={{ backgroundColor: tema.colorHex, color: tema.contrastHex }}
        >
          <Check size={12} />
          Fijar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSeleccionar(tema.id);
        }}
        className="flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition"
      >
        <Eye size={12} />
        Previsualizar
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onGuardar(tema.id);
        }}
        className="py-1.5 px-3 rounded-lg text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
        style={{ backgroundColor: tema.colorHex, color: tema.contrastHex }}
      >
        <Check size={12} />
        Fijar
      </button>
    </div>
  );
}
