"use client";

import React from "react";
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

  return (
    <div className="w-full lg:hidden space-y-2">
      {/* Selector Rápido Dropdown para pantallas muy pequeñas */}
      <div className="sm:hidden">
        <label htmlFor="config-select-mobile" className="sr-only">
          Seleccionar sección
        </label>
        <select
          id="config-select-mobile"
          value={seccionActiva}
          onChange={(e) =>
            onCambiarSeccion(e.target.value as SeccionConfiguracionId)
          }
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none"
        >
          {GRUPOS_CONFIGURACION.map((grupo) => (
            <optgroup key={grupo.titulo} label={grupo.titulo}>
              {grupo.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Barra de píldoras con scroll horizontal para Tablets y Móviles medianos */}
      <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {todosLosItems.map((item) => {
          const Icon = item.icon;
          const activa = seccionActiva === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCambiarSeccion(item.id)}
              style={
                activa
                  ? {
                      backgroundColor: "var(--theme-primary)",
                      color: "var(--theme-primary-contrast)",
                      borderColor: "var(--theme-primary)",
                    }
                  : undefined
              }
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${
                activa
                  ? "shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
              }`}
            >
              <Icon
                size={14}
                className={activa ? "text-current" : "text-slate-400"}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
