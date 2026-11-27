"use client";

import React from "react";
import { Check, Eye, RotateCcw } from "lucide-react";
import { LISTA_TEMAS, type TemaConfig, type TemaId } from "@/lib/theme";
import { TemaCardActions } from "./TemaCardActions";

interface TemaGridProps {
  temaActual: TemaConfig;
  enVistaPrevia: boolean;
  onSeleccionar: (id: TemaId) => void;
  onGuardar: (id: TemaId) => void;
  onRestaurar: () => void;
  onCancelarPreview?: () => void;
}

export function TemaGrid({
  temaActual,
  enVistaPrevia,
  onSeleccionar,
  onGuardar,
  onRestaurar,
  onCancelarPreview,
}: TemaGridProps) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Temas Predefinidos Disponibles ({LISTA_TEMAS.length})
        </h3>
        <button
          type="button"
          onClick={onRestaurar}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <RotateCcw size={13} />
          Restaurar predeterminado
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 sm:gap-5">
        {LISTA_TEMAS.map((tema) => {
          const esActivo = temaActual.id === tema.id;
          const esElGuardado = !enVistaPrevia && esActivo;
          const esEnVistaPrevia = enVistaPrevia && esActivo;

          return (
            <div
              key={tema.id}
              onClick={() => {
                if (!esElGuardado && !esEnVistaPrevia) onSeleccionar(tema.id);
              }}
              className={`group relative rounded-2xl border bg-white p-5 sm:p-6 shadow-xs transition-all hover:shadow-md flex flex-col justify-between h-full ${
                esActivo
                  ? "border-slate-900 ring-2 ring-slate-900/10"
                  : "border-slate-200/90 hover:border-slate-300 cursor-pointer"
              }`}
            >
              <div className="flex-1 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-6 w-6 rounded-full shadow-2xs border border-white shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: tema.colorHex }}
                    >
                      {esActivo && (
                        <Check size={13} style={{ color: tema.contrastHex }} strokeWidth={3} />
                      )}
                    </span>
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {tema.nombre}
                    </span>
                  </div>

                  {esElGuardado ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check size={12} /> Activo
                    </span>
                  ) : esEnVistaPrevia ? (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200 flex items-center gap-1 animate-pulse">
                      <Eye size={12} /> Previsualizando
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 border border-slate-200">
                      Disponible
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[34px]">
                  {tema.descripcion}
                </p>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100/90">
                  <div className="h-5 flex-1 rounded-md shadow-2xs" style={{ backgroundColor: tema.colorHex }} title="Color Principal" />
                  <div className="h-5 flex-1 rounded-md shadow-2xs" style={{ backgroundColor: tema.hoverHex }} title="Color Hover" />
                  <div className="h-5 flex-1 rounded-md shadow-2xs border border-slate-200" style={{ backgroundColor: tema.accentLightHex }} title="Acento Claro" />
                  <div className="h-5 flex-1 rounded-md shadow-2xs" style={{ backgroundColor: tema.contrastHex }} title="Contraste" />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <TemaCardActions
                  tema={tema}
                  esElGuardado={esElGuardado}
                  esEnVistaPrevia={esEnVistaPrevia}
                  onSeleccionar={onSeleccionar}
                  onGuardar={onGuardar}
                  onCancelarPreview={onCancelarPreview}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
