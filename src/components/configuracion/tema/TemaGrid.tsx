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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Temas Predefinidos Disponibles (6)
        </h3>
        <button
          type="button"
          onClick={onRestaurar}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <RotateCcw size={13} />
          Restaurar predeterminado
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {LISTA_TEMAS.map((tema) => {
          const esActivo = temaActual.id === tema.id;
          const esElGuardado = !enVistaPrevia && esActivo;

          return (
            <div
              key={tema.id}
              onClick={() => onSeleccionar(tema.id)}
              className={`group relative rounded-lg border bg-white p-4 shadow-xs cursor-pointer transition-all hover:shadow-md ${
                esActivo
                  ? "border-slate-900 ring-2 ring-slate-900/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded-full shadow-xs border border-white shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: tema.colorHex }}
                  >
                    {esActivo && (
                      <Check
                        size={11}
                        style={{ color: tema.contrastHex }}
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {tema.nombre}
                  </span>
                </div>

                {esElGuardado ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Activo
                  </span>
                ) : esActivo ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    En prueba
                  </span>
                ) : null}
              </div>

              <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                {tema.descripcion}
              </p>

              {/* Muestra Visual */}
              <div className="flex items-center gap-1 mb-3 p-1.5 rounded-md bg-slate-50 border border-slate-100">
                <div
                  className="h-4 flex-1 rounded shadow-2xs"
                  style={{ backgroundColor: tema.colorHex }}
                />
                <div
                  className="h-4 flex-1 rounded shadow-2xs"
                  style={{ backgroundColor: tema.hoverHex }}
                />
                <div
                  className="h-4 flex-1 rounded shadow-2xs border border-slate-200"
                  style={{ backgroundColor: tema.accentLightHex }}
                />
                <div
                  className="h-4 flex-1 rounded shadow-2xs"
                  style={{ backgroundColor: tema.contrastHex }}
                />
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeleccionar(tema.id);
                  }}
                  className={`flex-1 py-1 px-2 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    esActivo
                      ? "bg-slate-100 text-slate-900"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <Eye size={12} />
                  {esActivo ? "Probando" : "Previsualizar"}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuardar(tema.id);
                  }}
                  className="py-1 px-2.5 rounded-md text-[11px] font-bold transition shadow-xs flex items-center gap-1"
                  style={{
                    backgroundColor: tema.colorHex,
                    color: tema.contrastHex,
                  }}
                >
                  <Check size={12} />
                  Fijar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
