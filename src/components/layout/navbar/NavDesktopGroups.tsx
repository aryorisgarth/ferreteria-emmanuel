"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { GRUPOS_NAVEGACION, type GrupoNav, type NavbarProps } from "./nav-data";

interface NavDesktopGroupsProps {
  pathname: string;
  grupoAbierto: string | null;
  setGrupoAbierto: (id: string | null) => void;
  alertas?: NavbarProps["alertas"];
}

export function NavDesktopGroups({
  pathname,
  grupoAbierto,
  setGrupoAbierto,
  alertas,
}: NavDesktopGroupsProps) {
  const esRutaActiva = (href: string) => {
    if (href === "/inicio") return pathname === "/inicio";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const esGrupoActivo = (grupo: GrupoNav) => {
    return grupo.items.some((item) => esRutaActiva(item.href));
  };

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {GRUPOS_NAVEGACION.map((grupo) => {
        const activo = esGrupoActivo(grupo);
        const desplegado = grupoAbierto === grupo.id;
        const tieneAlerta = grupo.items.some((item) => item.badge && (item.badge(alertas) ?? 0) > 0);

        return (
          <div key={grupo.id} className="relative">
            <button
              type="button"
              onClick={() => setGrupoAbierto(desplegado ? null : grupo.id)}
              style={{
                color: "var(--theme-header-text, #0F172A)",
                backgroundColor: desplegado || activo ? "var(--theme-header-subnav-bg, #F1F5F9)" : undefined,
                borderColor: desplegado || activo ? "var(--theme-header-border, #E2E8F0)" : "transparent",
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition ${
                desplegado || activo ? "font-bold shadow-2xs" : "hover:bg-slate-100"
              }`}
            >
              <span>{grupo.label}</span>
              {tieneAlerta && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
              <ChevronDown
                size={13}
                style={{ color: "var(--theme-header-icon, #64748B)" }}
                className={`transition-transform duration-150 ${desplegado ? "rotate-180" : ""}`}
              />
            </button>

            {desplegado && (
              <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 rounded-md border border-slate-200 bg-white p-1.5 shadow-xl text-slate-800 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                  <span>Módulos de {grupo.label}</span>
                  <span className="text-[9px] font-normal text-slate-400">Esc para cerrar</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {grupo.items.map((item) => {
                    const itemActivo = esRutaActiva(item.href);
                    const Icon = item.icon;
                    const badgeVal = item.badge ? item.badge(alertas) : null;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setGrupoAbierto(null)}
                        style={{ backgroundColor: itemActivo ? "var(--theme-accent-light, #F1F5F9)" : undefined }}
                        className={`flex items-start gap-2.5 rounded p-2 text-xs transition ${
                          itemActivo ? "font-semibold text-slate-900 border border-slate-200" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <div
                          style={{ color: itemActivo ? "var(--theme-header-icon, #0F172A)" : undefined }}
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
                            itemActivo ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          <Icon size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{item.label}</span>
                            {badgeVal && (
                              <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[9px] font-bold text-rose-700 border border-rose-200">
                                {badgeVal}
                              </span>
                            )}
                            {item.tecla && (
                              <kbd className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-mono font-bold text-slate-600 border border-slate-200">
                                {item.tecla}
                              </kbd>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
