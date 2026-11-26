"use client";

import React from "react";
import { Settings, ShieldCheck, HardDrive } from "lucide-react";
import type { SeccionConfiguracionId } from "../types";
import { GRUPOS_CONFIGURACION } from "./navigation-items";

interface ConfiguracionHeaderProps {
  seccionActiva: SeccionConfiguracionId;
  modoDb: "local" | "supabase" | "postgres";
}

export function ConfiguracionHeader({
  seccionActiva,
  modoDb,
}: ConfiguracionHeaderProps) {
  const itemActual = GRUPOS_CONFIGURACION.flatMap((g) => g.items).find(
    (i) => i.id === seccionActiva
  );

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-slate-700" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Centro de Configuración
          </h2>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-600">
            {itemActual?.label || "General"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {itemActual?.descripcion ||
            "Administre los parámetros de su ferretería y terminal."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {modoDb === "postgres" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            <ShieldCheck size={13} className="text-emerald-600" />
            PostgreSQL Conectado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            <HardDrive size={13} className="text-amber-600" />
            Almacenamiento Local
          </span>
        )}
      </div>
    </div>
  );
}
