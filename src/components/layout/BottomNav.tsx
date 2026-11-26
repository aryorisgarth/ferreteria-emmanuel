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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden print:hidden select-none">
      <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">
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
              className={`flex h-12 min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg py-1 transition active:scale-95 cursor-pointer ${
                activo
                  ? "text-[var(--theme-primary,#0F172A)] font-bold bg-slate-50"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div className="relative">
                <Icono size={20} className={activo ? "text-[var(--theme-primary,#0F172A)]" : "text-slate-400"} />
                {activo && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3.5 rounded-full bg-[var(--theme-primary,#0F172A)]" />
                )}
              </div>
              <span className="text-[11px] leading-tight tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
