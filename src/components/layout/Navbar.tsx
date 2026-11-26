"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Menu, Settings, ShoppingCart, X } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import { NavDesktopGroups } from "./navbar/NavDesktopGroups";
import { NavSearchBar } from "./navbar/NavSearchBar";
import { NavUserMenu } from "./navbar/NavUserMenu";
import { NavMobileDrawer } from "./navbar/NavMobileDrawer";
import type { NavbarProps } from "./navbar/nav-data";

export function Navbar({ usuario, alertas }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(null);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setGrupoAbierto(null);
    setMenuUsuarioAbierto(false);
    setMenuMovilAbierto(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setGrupoAbierto(null);
        setMenuUsuarioAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        document.getElementById("top-search-input")?.focus();
      } else if (e.key === "F1") {
        e.preventDefault();
        router.push("/caja");
      } else if (e.key === "Escape") {
        setGrupoAbierto(null);
        setMenuUsuarioAbierto(false);
        setMenuMovilAbierto(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim()) {
      router.push(`/inventario?q=${encodeURIComponent(busqueda.trim())}`);
      setBusqueda("");
    }
  };

  return (
    <header
      ref={navRef}
      style={{
        backgroundColor: "var(--theme-header-bg, #FFFFFF)",
        borderColor: "var(--theme-header-border, #E2E8F0)",
        color: "var(--theme-header-text, #0F172A)",
      }}
      className="sticky top-0 z-40 w-full border-b shadow-2xs transition-colors duration-200 print:hidden"
    >
      <div className="flex h-[52px] w-full items-center justify-between px-3 sm:px-5 lg:px-6 gap-3">
        <div className="flex items-center gap-4 lg:gap-5 min-w-0">
          <Link href="/inicio" className="flex items-center shrink-0 transition hover:opacity-95" aria-label="Ferretería Emmanuel - Panel Principal">
            <Logo variante="color" className="h-8 sm:h-9 w-auto" prioridad />
          </Link>
          <div className="hidden lg:block h-5 w-[1px]" style={{ backgroundColor: "var(--theme-header-border, #E2E8F0)" }} />
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/inicio"
              style={{
                color: "var(--theme-header-text, #0F172A)",
                backgroundColor: pathname === "/inicio" ? "var(--theme-header-subnav-bg, #F1F5F9)" : undefined,
                borderColor: pathname === "/inicio" ? "var(--theme-header-border, #E2E8F0)" : "transparent",
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition ${
                pathname === "/inicio" ? "font-bold shadow-2xs" : "hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard size={14} style={{ color: "var(--theme-header-icon, #334155)" }} />
              <span>Control</span>
            </Link>
            <NavDesktopGroups
              pathname={pathname}
              grupoAbierto={grupoAbierto}
              setGrupoAbierto={setGrupoAbierto}
              alertas={alertas}
            />
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <NavSearchBar busqueda={busqueda} setBusqueda={setBusqueda} onSubmit={handleBuscar} />
          <Link
            href="/caja"
            title="Abrir Punto de Venta [F1]"
            style={{ backgroundColor: "var(--theme-primary, #0F172A)", color: "var(--theme-primary-contrast, #FFFFFF)" }}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-bold shadow-xs transition hover:bg-slate-800 active:scale-95 shrink-0"
          >
            <ShoppingCart size={13} />
            <span className="hidden sm:inline">Punto de Venta</span>
            <span className="sm:hidden">Caja</span>
            <kbd className="hidden xl:inline rounded bg-white/20 px-1 py-0.2 text-[9px] font-mono font-extrabold text-white">F1</kbd>
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
            className="flex h-8 w-8 items-center justify-center rounded-md border lg:hidden hover:bg-black/[0.04]"
            aria-label="Abrir Menú de Navegación"
          >
            {menuMovilAbierto ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {menuMovilAbierto && (
        <NavMobileDrawer
          pathname={pathname}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          handleBuscar={handleBuscar}
          onClose={() => setMenuMovilAbierto(false)}
        />
      )}
    </header>
  );
}
