"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Receipt, Settings, Maximize2, Minimize2 } from "lucide-react";
import { salir } from "@/app/actions";
import { useFullscreen } from "@/components/pwa/useFullscreen";

interface NavUserMenuProps {
  usuario: string;
  menuUsuarioAbierto: boolean;
  setMenuUsuarioAbierto: (abierto: boolean) => void;
  onClose: () => void;
}

export function NavUserMenu({
  usuario,
  menuUsuarioAbierto,
  setMenuUsuarioAbierto,
  onClose,
}: NavUserMenuProps) {
  const { soportado, esFullscreen, alternarFullscreen } = useFullscreen();

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
        style={{
          borderColor: "var(--theme-header-border, #E2E8F0)",
          color: "var(--theme-header-text, #0F172A)",
          backgroundColor: "var(--theme-header-input-bg, #FFFFFF)",
        }}
        className="flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition hover:bg-black/[0.04]"
      >
        <div
          style={{
            backgroundColor: "var(--theme-header-subnav-bg, #F1F5F9)",
            color: "var(--theme-header-text, #0F172A)",
          }}
          className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold uppercase border border-slate-200"
        >
          {usuario.charAt(0)}
        </div>
        <span className="hidden sm:inline max-w-[80px] truncate">{usuario}</span>
        <ChevronDown size={12} style={{ color: "var(--theme-header-icon, #64748B)" }} />
      </button>

      {menuUsuarioAbierto && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-md border border-slate-200 bg-white p-1.5 shadow-xl text-slate-800 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Usuario en Sistema</p>
            <p className="truncate text-xs font-bold text-slate-900">{usuario}</p>
            <p className="text-[10px] text-emerald-600 font-medium">● Sesión Activa</p>
          </div>
          <div className="mt-1 space-y-0.5">
            <Link
              href="/total-del-dia"
              onClick={onClose}
              className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <Receipt size={13} />
              <span>Arqueo Diario</span>
            </Link>
            <Link
              href="/configuracion"
              onClick={onClose}
              className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <Settings size={13} />
              <span>Configuración</span>
            </Link>
            {soportado && (
              <button
                type="button"
                onClick={() => {
                  alternarFullscreen();
                  onClose();
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                {esFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{esFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}</span>
              </button>
            )}
            <form action={salir}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={13} />
                <span>Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
