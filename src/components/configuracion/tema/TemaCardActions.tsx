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
      <div className="flex items-center justify-center py-2 text-xs font-bold text-emerald-700 bg-emerald-50/80 rounded-xl border border-emerald-200/80">
        <Check size={14} className="mr-1.5" /> Tema Activo en este Terminal
      </div>
    );
  }

  if (esEnVistaPrevia) {
    return (
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancelarPreview?.();
          }}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
        >
          <X size={13} />
          Cancelar
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGuardar(tema.id);
          }}
          className="flex-1 py-2 px-3.5 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
          style={{ backgroundColor: tema.colorHex, color: tema.contrastHex }}
        >
          <Check size={13} />
          Fijar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSeleccionar(tema.id);
        }}
        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
      >
        <Eye size={13} />
        Previsualizar
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onGuardar(tema.id);
        }}
        className="py-2 px-3.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
        style={{ backgroundColor: tema.colorHex, color: tema.contrastHex }}
      >
        <Check size={13} />
        Fijar
      </button>
    </div>
  );
}
