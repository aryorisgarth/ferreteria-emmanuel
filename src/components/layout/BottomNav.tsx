"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis, FileText, LayoutDashboard, Package, ShoppingCart } from "lucide-react";

const ITEMS = [
  { href: "/inicio", label: "Control", icon: LayoutDashboard },
  { href: "/caja", label: "Caja POS", icon: ShoppingCart },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/cotizaciones", label: "Cotizar", icon: FileText },
  { href: "/mas", label: "Más", icon: Ellipsis },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/98 px-2 py-1 backdrop-blur-xs lg:hidden shadow-xs safe-bottom print:hidden">
      <div className="grid grid-cols-5 gap-1">
        {ITEMS.map((item) => {
          const Icono = item.icon;
          const activo =
            item.href === "/mas"
              ? pathname === "/mas"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded py-0.5 transition ${
                activo
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <Icono size={18} className={activo ? "text-slate-900" : "text-slate-400"} />
                {activo && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-[var(--theme-primary,#0F172A)]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
