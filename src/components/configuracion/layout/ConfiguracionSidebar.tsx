"use client";

import React from "react";
import type { SeccionConfiguracionId } from "../types";
import { GRUPOS_CONFIGURACION } from "./navigation-items";

interface ConfiguracionSidebarProps {
  seccionActiva: SeccionConfiguracionId;
  onCambiarSeccion: (id: SeccionConfiguracionId) => void;
}

export function ConfiguracionSidebar({
  seccionActiva,
  onCambiarSeccion,
}: ConfiguracionSidebarProps) {
  return (
    <aside className="w-64 shrink-0 rounded-lg border border-slate-200/80 bg-white p-3 shadow-xs">
      <div className="space-y-5">
        {GRUPOS_CONFIGURACION.map((grupo) => (
          <div key={grupo.titulo} className="space-y-1">
            <h3 className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {grupo.titulo}
            </h3>
            <div className="space-y-0.5">
              {grupo.items.map((item) => {
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
                    className={`group flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs font-semibold transition-all border ${
                      activa
                        ? "shadow-xs border-transparent"
                        : "border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        size={15}
                        className={
                          activa
                            ? "text-current shrink-0"
                            : "text-slate-400 group-hover:text-slate-600 shrink-0"
                        }
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          activa
                            ? "bg-black/20 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
