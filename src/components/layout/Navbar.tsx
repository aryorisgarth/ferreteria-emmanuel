"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import { NavDesktopGroups } from "./navbar/NavDesktopGroups";
import { NavActionsRight } from "./navbar/NavActionsRight";
import { NavMobileDrawer } from "./navbar/NavMobileDrawer";
import { ModalBusquedaGlobal } from "./navbar/ModalBusquedaGlobal";
import type { NavbarProps } from "./navbar/nav-data";

export function Navbar({ usuario, alertas }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [modalBusquedaAbierto, setModalBusquedaAbierto] = useState(false);
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
        setModalBusquedaAbierto(true);
      } else if (e.key === "F1") {
        e.preventDefault();
        router.push("/caja");
      } else if (e.key === "Escape") {
        setGrupoAbierto(null);
        setMenuUsuarioAbierto(false);
        setMenuMovilAbierto(false);
        setModalBusquedaAbierto(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  return (
    <>
      <header
        ref={navRef}
        style={{
          backgroundColor: "var(--theme-header-bg, #FFFFFF)",
          borderColor: "var(--theme-header-border, #E2E8F0)",
          color: "var(--theme-header-text, #0F172A)",
        }}
        className="w-full shrink-0 z-40 border-b shadow-2xs transition-colors duration-200 print:hidden"
      >
        <div className="flex h-[52px] w-full items-center justify-between px-3 sm:px-5 lg:px-6 gap-3">
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0">
            <Link href="/inicio" className="flex items-center shrink-0 transition hover:opacity-95" aria-label="Ferretería Emmanuel - Panel Principal">
              <Logo variante="color" className="h-7 sm:h-8 w-auto" prioridad />
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition ${pathname === "/inicio" ? "font-bold shadow-2xs" : "hover:bg-slate-100"
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

          <NavActionsRight
            usuario={usuario}
            pathname={pathname}
            menuUsuarioAbierto={menuUsuarioAbierto}
            setMenuUsuarioAbierto={setMenuUsuarioAbierto}
            menuMovilAbierto={menuMovilAbierto}
            setMenuMovilAbierto={setMenuMovilAbierto}
            onAbrirBusqueda={() => setModalBusquedaAbierto(true)}
          />
        </div>

        {menuMovilAbierto && (
          <NavMobileDrawer
            pathname={pathname}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            handleBuscar={(e) => {
              e.preventDefault();
              if (busqueda.trim()) {
                router.push(`/inventario?q=${encodeURIComponent(busqueda.trim())}`);
                setBusqueda("");
                setMenuMovilAbierto(false);
              }
            }}
            onClose={() => setMenuMovilAbierto(false)}
          />
        )}
      </header>

      <ModalBusquedaGlobal
        abierto={modalBusquedaAbierto}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onCerrar={() => setModalBusquedaAbierto(false)}
      />
    </>
  );
}
