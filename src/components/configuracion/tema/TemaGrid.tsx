"use client";

import React from "react";
import { Check, Eye, RotateCcw } from "lucide-react";
import { LISTA_TEMAS, type TemaConfig, type TemaId } from "@/lib/theme";

interface TemaGridProps {
  temaActual: TemaConfig;
  enVistaPrevia: boolean;
  onSeleccionar: (id: TemaId) => void;
  onGuardar: (id: TemaId) => void;
  onRestaurar: () => void;
}

export function TemaGrid({
  temaActual,
  enVistaPrevia,
  onSeleccionar,
  onGuardar,
  onRestaurar,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LISTA_TEMAS.map((tema) => {
          const esActivo = temaActual.id === tema.id;
          const esElGuardado = !enVistaPrevia && esActivo;
          const esEnVistaPrevia = enVistaPrevia && esActivo;

          return (
            <div
              key={tema.id}
              onClick={() => onSeleccionar(tema.id)}
              className={`group relative rounded-xl border bg-white p-4.5 shadow-xs cursor-pointer transition-all hover:shadow-md flex flex-col justify-between h-full ${
                esActivo
                  ? "border-slate-900 ring-2 ring-slate-900/10"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-5 w-5 rounded-full shadow-2xs border border-white shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: tema.colorHex }}
                    >
                      {esActivo && (
                        <Check size={11} style={{ color: tema.contrastHex }} strokeWidth={3} />
                      )}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {tema.nombre}
                    </span>
                  </div>

                  {esElGuardado ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check size={10} /> Activo
                    </span>
                  ) : esEnVistaPrevia ? (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 flex items-center gap-1 animate-pulse">
                      <Eye size={10} /> Previsualizando
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                      Disponible
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {tema.descripcion}
                </p>

                {/* Muestra Visual de Colores */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="h-4 flex-1 rounded shadow-2xs" style={{ backgroundColor: tema.colorHex }} title="Color Principal" />
                  <div className="h-4 flex-1 rounded shadow-2xs" style={{ backgroundColor: tema.hoverHex }} title="Color Hover" />
                  <div className="h-4 flex-1 rounded shadow-2xs border border-slate-200" style={{ backgroundColor: tema.accentLightHex }} title="Acento Claro" />
                  <div className="h-4 flex-1 rounded shadow-2xs" style={{ backgroundColor: tema.contrastHex }} title="Contraste" />
                </div>
              </div>

              {/* Botones de Acción al pie de la tarjeta */}
              <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeleccionar(tema.id);
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    esActivo
                      ? "bg-slate-100 text-slate-900 border border-slate-200"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
                  }`}
                >
                  <Eye size={13} />
                  {esActivo ? "Probando" : "Previsualizar"}
                </button>

                {!esElGuardado && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGuardar(tema.id);
                    }}
                    className="py-1.5 px-3 rounded-lg text-[11px] font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    style={{
                      backgroundColor: tema.colorHex,
                      color: tema.contrastHex,
                    }}
                  >
                    <Check size={13} />
                    Fijar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
