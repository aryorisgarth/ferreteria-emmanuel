"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Search, Settings } from "lucide-react";
import { salir } from "@/app/actions";
import { GRUPOS_NAVEGACION } from "./nav-data";

interface NavMobileDrawerProps {
  pathname: string;
  busqueda: string;
  setBusqueda: (val: string) => void;
  handleBuscar: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function NavMobileDrawer({
  pathname,
  busqueda,
  setBusqueda,
  handleBuscar,
  onClose,
}: NavMobileDrawerProps) {
  const esRutaActiva = (href: string) => {
    if (href === "/inicio") return pathname === "/inicio";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4 lg:hidden max-h-[calc(100vh-60px)] overflow-y-auto space-y-4 text-slate-800 shadow-xl">
      <form onSubmit={handleBuscar} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar artículo, código o cliente..."
          className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none"
        />
      </form>

      <div className="space-y-3">
        <Link
          href="/inicio"
          onClick={onClose}
          style={{
            backgroundColor: pathname === "/inicio" ? "var(--theme-primary, #0F172A)" : undefined,
            color: pathname === "/inicio" ? "var(--theme-primary-contrast, #FFFFFF)" : undefined,
          }}
          className={`flex items-center gap-2 rounded-md p-2.5 text-xs font-semibold ${
            pathname === "/inicio" ? "font-bold" : "bg-slate-100 text-slate-800"
          }`}
        >
          <LayoutDashboard size={15} />
          <span>Panel de Control</span>
        </Link>

        {GRUPOS_NAVEGACION.map((grupo) => (
          <div key={grupo.id} className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">{grupo.label}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {grupo.items.map((item) => {
                const activo = esRutaActiva(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    style={{
                      backgroundColor: activo ? "var(--theme-primary, #0F172A)" : undefined,
                      color: activo ? "var(--theme-primary-contrast, #FFFFFF)" : undefined,
                    }}
                    className={`flex items-center gap-2 rounded-md p-2 text-xs font-semibold ${
                      activo ? "font-bold" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    <Icon size={14} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
        <Link
          href="/configuracion"
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          <Settings size={14} />
          <span>Configuración</span>
        </Link>
        <form action={salir}>
          <button type="submit" className="flex items-center gap-1 text-xs font-medium text-rose-600">
            <LogOut size={13} />
            <span>Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </div>
  );
}
