"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  LogOut,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Sparkles,
  User,
} from "lucide-react";
import { salir } from "@/app/actions";
import { Logo } from "@/components/marca/Logo";

interface HeaderProps {
  usuario: string;
  alertas?: {
    stockBajo?: number;
    porCobrar?: number;
  };
}

export function Header({ usuario, alertas }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hora, setHora] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();
      setHora(
        ahora.toLocaleTimeString("es-HN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };
    actualizar();
    const timer = setInterval(actualizar, 30000);
    return () => clearInterval(timer);
  }, []);

  // Atajo de teclado global: '/' o 'Ctrl+K' para buscar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && document.activeElement?.tagName !== "INPUT")) {
        e.preventDefault();
        const input = document.getElementById("buscador-global") as HTMLInputElement | null;
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim()) {
      router.push(`/inventario?q=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  // Mapeo amigable de la ruta actual
  const getTituloRuta = () => {
    if (pathname.startsWith("/caja")) return "Punto de Venta";
    if (pathname.startsWith("/inventario")) return "Inventario & Materiales";
    if (pathname.startsWith("/cotizaciones")) return "Cotizaciones";
    if (pathname.startsWith("/facturas")) return "Facturas & Cobros";
    if (pathname.startsWith("/clientes")) return "Clientes";
    if (pathname.startsWith("/proveedores")) return "Proveedores";
    if (pathname.startsWith("/compras")) return "Compras de Mercadería";
    if (pathname.startsWith("/gastos")) return "Control de Gastos";
    if (pathname.startsWith("/kardex")) return "Kárdex de Existencias";
    if (pathname.startsWith("/movimientos")) return "Movimientos de Entrada/Salida";
    if (pathname.startsWith("/solicitudes")) return "Solicitudes de Material";
    if (pathname.startsWith("/actas")) return "Actas de Entrega";
    return "Panel Principal";
  };

  const totalAlertas = (alertas?.stockBajo ?? 0) + (alertas?.porCobrar ? 1 : 0);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-8 backdrop-blur-xl transition-all">
      {/* Izquierda: Título y miga de pan contextual */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <Logo variante="color" compacto />
        </div>
        <div className="hidden lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Ferretería Emmanuel</p>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{getTituloRuta()}</h2>
        </div>
      </div>

      {/* Centro: Buscador Global (Command bar) */}
      <form onSubmit={handleBuscar} className="relative hidden md:block w-72 lg:w-96">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          id="buscador-global"
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar artículo, código o cliente... (Ctrl+K)"
          className="h-10 w-full rounded-full border border-slate-200/90 bg-slate-50/80 pl-10 pr-12 text-xs font-medium text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 shadow-xs">
          /
        </kbd>
      </form>

      {/* Derecha: Acciones rápidas, reloj y usuario */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Acceso Rápido a Cobro (Caja POS) */}
        <Link
          href="/caja"
          className="group inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 text-xs font-bold text-slate-950 shadow-sm shadow-amber-500/20 transition-all hover:brightness-105 active:scale-95 sm:h-10 sm:px-4 sm:text-sm"
        >
          <ShoppingCart size={16} className="transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Nueva Venta</span>
          <span className="sm:hidden">Caja</span>
        </Link>

        {/* Indicador de Hora / Estado de Turno */}
        {hora && (
          <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Clock size={13} className="text-slate-400" />
            <span>{hora}</span>
          </div>
        )}

        {/* Notificaciones / Alertas activas */}
        {totalAlertas > 0 && (
          <Link
            href="/inicio"
            title={`${alertas?.stockBajo ?? 0} artículos con stock bajo`}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition-colors hover:border-amber-400 hover:text-amber-600"
          >
            <Bell size={17} />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-slate-950 shadow-xs">
              {totalAlertas}
            </span>
          </Link>
        )}

        {/* Perfil del Usuario y Cierre de Sesión */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white p-1 pr-2.5 transition-all hover:border-slate-300"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 text-xs font-bold text-white shadow-xs">
              {usuario.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700 max-w-[90px] truncate">
              {usuario}
            </span>
          </button>

          {/* Menú Flotante de Usuario */}
          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuAbierto(false)} />
              <div className="absolute right-0 top-12 z-40 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sesión iniciada</p>
                  <p className="truncate text-sm font-bold text-slate-800">{usuario}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">● Caja y mostrador activo</p>
                </div>
                <div className="mt-1 space-y-0.5">
                  <Link
                    href="/total-del-dia"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Receipt size={15} className="text-slate-400" />
                    Total del día
                  </Link>
                  <form action={salir}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut size={15} />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

