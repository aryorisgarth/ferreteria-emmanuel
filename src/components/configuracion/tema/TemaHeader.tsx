"use client";

import React from "react";
import { Palette, User } from "lucide-react";
import type { TemaConfig } from "@/lib/theme";

interface TemaHeaderProps {
  temaActual: TemaConfig;
  usuarioDisplay: string;
}

export function TemaHeader({
  temaActual,
  usuarioDisplay,
}: TemaHeaderProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg shadow-xs transition-colors duration-300"
          style={{
            backgroundColor: temaActual.colorHex,
            color: temaActual.contrastHex,
          }}
        >
          <Palette size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Personalización de Apariencia & Colores
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
              Por Usuario
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Seleccione la paleta de color para su entorno de trabajo. Cada cajero
            o administrador puede fijar su propio tema de forma independiente.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-1.5 self-start md:self-auto">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-white font-bold text-xs">
          <User size={14} />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Preferencia para
          </p>
          <p className="text-xs font-extrabold text-slate-900 truncate max-w-[140px]">
            {usuarioDisplay}
          </p>
        </div>
      </div>
    </div>
  );
}
