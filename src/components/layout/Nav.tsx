"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  ClipboardList,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import { NAV } from "@/lib/nav";

const ICONS = {
  control: LayoutDashboard,
  caja: ShoppingCart,
  inventario: Package,
  cotizaciones: FileText,
  facturas: Receipt,
  clientes: Users,
  proveedores: Warehouse,
  compras: Truck,
  gastos: Wallet,
  movimientos: ArrowLeftRight,
  kardex: BookOpen,
  solicitudes: ClipboardList,
  actas: FileCheck2,
};

// Agrupación optimizada y más equilibrada
const SECCIONES = [
  { nombre: "General", items: ["/inicio", "/caja", "/inventario"] },
  { nombre: "Ventas", items: ["/cotizaciones", "/facturas", "/clientes"] },
  { nombre: "Compras & Gastos", items: ["/proveedores", "/compras", "/gastos"] },
  { nombre: "Control de Bodega", items: ["/movimientos", "/kardex", "/solicitudes", "/actas"] },
];

interface NavProps {
  colapsado: boolean;
  alertas?: {
    stockBajo?: number;
    porCobrar?: number;
  };
}

export function Nav({ colapsado, alertas }: NavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-2.5 py-2 scrollbar-thin scrollbar-thumb-slate-800">
      {SECCIONES.map((seccion) => {
        const enlaces = NAV.filter((item) => seccion.items.includes(item.href));
        if (enlaces.length === 0) return null;

        return (
          <div key={seccion.nombre} className="space-y-1">
            {!colapsado && (
              <p className="px-3 pb-1 pt-1 text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase">
                {seccion.nombre}
              </p>
            )}
            {colapsado && <div className="my-1.5 h-px bg-slate-800/80 mx-2" />}

            <div className="flex flex-col gap-1">
              {enlaces.map((item) => {
                const Icono = ICONS[item.icon];
                const activo = pathname === item.href || (item.href !== "/inicio" && pathname.startsWith(`${item.href}/`));

                // Alertas dinámicas
                const badgeStock = item.href === "/inventario" && (alertas?.stockBajo ?? 0) > 0 ? alertas?.stockBajo : null;
                const badgeCobros = item.href === "/facturas" && (alertas?.porCobrar ?? 0) > 0 ? "!" : null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={colapsado ? item.label : undefined}
                    className={`group relative flex items-center rounded-2xl transition-all duration-150 ${
                      colapsado
                        ? "h-11 w-11 justify-center mx-auto"
                        : "h-10 px-3 gap-3 justify-start"
                    } ${
                      activo
                        ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 font-bold border border-amber-500/30 shadow-sm shadow-amber-500/10"
                        : "text-slate-400 font-medium hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    {/* Indicador de barra izquierda activa */}
                    {activo && !colapsado && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-amber-400" />
                    )}

                    <div className="relative">
                      <Icono
                        size={18}
                        strokeWidth={activo ? 2.3 : 1.9}
                        className={`transition-transform duration-200 group-hover:scale-110 ${
                          activo ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      {/* Badge en modo colapsado */}
                      {colapsado && (badgeStock || badgeCobros) && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-slate-900" />
                      )}
                    </div>

                    {!colapsado && (
                      <span className="truncate text-xs tracking-tight flex-1">
                        {item.label}
                      </span>
                    )}

                    {/* Badge en modo expandido */}
                    {!colapsado && badgeStock && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                        {badgeStock}
                      </span>
                    )}

                    {/* Tooltip flotante al pasar el cursor en modo colapsado */}
                    {colapsado && (
                      <div className="pointer-events-none fixed left-24 z-50 ml-2 hidden rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block">
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {badgeStock && (
                            <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-black text-slate-950">
                              {badgeStock}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
