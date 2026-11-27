"use client";

import React from "react";
import { ChevronDown, Layers } from "lucide-react";
import type { SeccionConfiguracionId } from "../types";
import { GRUPOS_CONFIGURACION } from "./navigation-items";

interface ConfiguracionMobileNavProps {
  seccionActiva: SeccionConfiguracionId;
  onCambiarSeccion: (id: SeccionConfiguracionId) => void;
}

export function ConfiguracionMobileNav({
  seccionActiva,
  onCambiarSeccion,
}: ConfiguracionMobileNavProps) {
  const todosLosItems = GRUPOS_CONFIGURACION.flatMap((g) => g.items);
  const itemActual = todosLosItems.find((i) => i.id === seccionActiva) || todosLosItems[0];
  const grupoActual = GRUPOS_CONFIGURACION.find((g) =>
    g.items.some((i) => i.id === seccionActiva)
  );
  const IconoActual = itemActual?.icon || Layers;

  return (
    <div className="w-full md:hidden sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="relative">
        <label htmlFor="config-selector-global" className="sr-only">
          Cambiar sección de configuración
        </label>
        <div className="flex items-center justify-between w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 shadow-xs transition hover:border-slate-400">
          <div className="flex items-center gap-2.5 min-w-0 pr-8">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0">
              <IconoActual size={15} />
            </div>
            <div className="text-left min-w-0 truncate">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {grupoActual?.titulo || "Configuración"}
              </p>
              <p className="text-xs font-extrabold text-slate-900 truncate">
                {itemActual?.label}
              </p>
            </div>
          </div>
          <ChevronDown size={17} className="text-slate-400 shrink-0 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Selector nativo transparente sobre el contenedor para máxima accesibilidad móvil */}
        <select
          id="config-selector-global"
          value={seccionActiva}
          onChange={(e) => onCambiarSeccion(e.target.value as SeccionConfiguracionId)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
        >
          {GRUPOS_CONFIGURACION.map((grupo) => (
            <optgroup key={grupo.titulo} label={grupo.titulo}>
              {grupo.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {grupo.titulo}: {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
