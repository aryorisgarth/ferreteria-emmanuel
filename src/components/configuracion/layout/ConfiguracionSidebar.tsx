"use client";

import React from "react";
import type { SeccionConfiguracionId } from "../types";
import { GRUPOS_CONFIGURACION } from "./navigation-items";

interface ConfiguracionSidebarProps {
  seccionActiva: SeccionConfiguracionId;
  onCambiarSeccion: (id: SeccionConfiguracionId) => void;
  className?: string;
}

export function ConfiguracionSidebar({
  seccionActiva,
  onCambiarSeccion,
  className = "",
}: ConfiguracionSidebarProps) {
  return (
    <aside
      className={`w-60 lg:w-64 shrink-0 rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs sticky top-3 self-start max-h-[calc(100dvh-80px)] overflow-y-auto overscroll-contain select-none z-20 ${className}`}
    >
      <div className="space-y-4">
        {GRUPOS_CONFIGURACION.map((grupo) => (
          <div key={grupo.titulo} className="space-y-1">
            <h3 className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                            backgroundColor: "var(--theme-primary, #0F172A)",
                            color: "var(--theme-primary-contrast, #FFFFFF)",
                            borderColor: "var(--theme-primary, #0F172A)",
                          }
                        : undefined
                    }
                    className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-all border cursor-pointer ${
                      activa
                        ? "shadow-xs border-transparent font-bold"
                        : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
