"use client";

import React from "react";
import { Eye } from "lucide-react";
import type { TemaConfig, TemaId } from "@/lib/theme";

interface TemaBannerPreviewProps {
  temaPreview: TemaConfig;
  usuarioDisplay: string;
  onDescartar: () => void;
  onGuardar: (id: TemaId) => void;
}

export function TemaBannerPreview({
  temaPreview,
  usuarioDisplay,
  onDescartar,
  onGuardar,
}: TemaBannerPreviewProps) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md shadow-xs shrink-0"
          style={{
            backgroundColor: temaPreview.colorHex,
            color: temaPreview.contrastHex,
          }}
        >
          <Eye size={15} />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-950">
            Vista previa activa:{" "}
            <span className="underline">{temaPreview.nombre}</span>
          </p>
          <p className="text-[11px] text-amber-800">
            La interfaz se actualiza en tiempo real. Guarde para fijar este
            tema.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onDescartar}
          className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={() => onGuardar(temaPreview.id)}
          className="px-3.5 py-1.5 rounded-md text-xs font-bold shadow-xs transition active:scale-95"
          style={{
            backgroundColor: temaPreview.colorHex,
            color: temaPreview.contrastHex,
          }}
        >
          Guardar para {usuarioDisplay}
        </button>
      </div>
    </div>
  );
}
