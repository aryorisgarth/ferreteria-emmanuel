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
    <nav
      style={{
        backgroundColor: "var(--theme-header-bg, #FFFFFF)",
        borderColor: "var(--theme-header-border, #E2E8F0)",
        color: "var(--theme-header-text, #0F172A)",
      }}
      className="w-full shrink-0 z-40 border-t px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden print:hidden select-none transition-colors duration-200"
    >
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
              style={{
                backgroundColor: activo ? "var(--theme-accent-light, #F1F5F9)" : "transparent",
                borderColor: activo ? "var(--theme-accent-border, #CBD5E1)" : "transparent",
                color: activo
                  ? "var(--theme-header-text, #0F172A)"
                  : "var(--theme-header-text-muted, #64748B)",
              }}
              className={`flex h-12 min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg py-1 border transition active:scale-95 cursor-pointer ${
                activo ? "font-bold shadow-2xs" : "hover:opacity-80"
              }`}
            >
              <div className="relative">
                <Icono
                  size={20}
                  style={{
                    color: activo
                      ? "var(--theme-primary, #0F172A)"
                      : "var(--theme-header-text-muted, #64748B)",
                  }}
                />
                {activo && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3.5 rounded-full"
                    style={{ backgroundColor: "var(--theme-primary, #0F172A)" }}
                  />
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
