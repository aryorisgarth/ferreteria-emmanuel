"use client";

import Link from "next/link";
import { Menu, Settings, ShoppingCart, X } from "lucide-react";
import { NavSearchBar } from "./NavSearchBar";
import { NavUserMenu } from "./NavUserMenu";

interface Props {
  usuario: string;
  pathname: string;
  menuUsuarioAbierto: boolean;
  setMenuUsuarioAbierto: (val: boolean) => void;
  menuMovilAbierto: boolean;
  setMenuMovilAbierto: (val: boolean) => void;
  onAbrirBusqueda: () => void;
}

export function NavActionsRight({
  usuario,
  pathname,
  menuUsuarioAbierto,
  setMenuUsuarioAbierto,
  menuMovilAbierto,
  setMenuMovilAbierto,
  onAbrirBusqueda,
}: Props) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
      <NavSearchBar onAbrirModal={onAbrirBusqueda} />
      <Link
        href="/caja"
        title="Abrir Punto de Venta [F1]"
        style={{
          backgroundColor: "var(--theme-primary, #0F172A)",
          color: "var(--theme-primary-contrast, #FFFFFF)",
        }}
        className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 sm:px-3 text-xs font-bold shadow-xs transition hover:bg-slate-800 active:scale-95 shrink-0"
      >
        <ShoppingCart size={13} />
        <span className="hidden md:inline">Punto de Venta</span>
        <span className="md:hidden">POS</span>
        <kbd className="hidden xl:inline rounded bg-white/20 px-1 py-0.2 text-[9px] font-mono font-extrabold text-white">
          F1
        </kbd>
      </Link>
      <Link
        href="/configuracion"
        title="Configuración del Negocio"
        style={{
          borderColor: "var(--theme-header-border, #E2E8F0)",
          color: "var(--theme-header-text, #0F172A)",
          backgroundColor: pathname === "/configuracion" ? "var(--theme-header-subnav-bg, #F1F5F9)" : "transparent",
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md border transition shrink-0 hover:bg-slate-100"
      >
        <Settings size={14} style={{ color: "var(--theme-header-icon, #334155)" }} />
      </Link>
      <NavUserMenu
        usuario={usuario}
        menuUsuarioAbierto={menuUsuarioAbierto}
        setMenuUsuarioAbierto={setMenuUsuarioAbierto}
        onClose={() => setMenuUsuarioAbierto(false)}
      />
      <button
        type="button"
        onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
        style={{ borderColor: "var(--theme-header-border, #E2E8F0)", color: "var(--theme-header-text, #0F172A)" }}
        className="flex h-8 w-8 items-center justify-center rounded-md border lg:hidden hover:bg-black/[0.04] cursor-pointer"
        aria-label="Abrir Menú de Navegación"
      >
        {menuMovilAbierto ? <X size={16} /> : <Menu size={16} />}
      </button>
    </div>
  );
}
