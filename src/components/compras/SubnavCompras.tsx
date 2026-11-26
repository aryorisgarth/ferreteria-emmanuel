"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, ClipboardList, PackageCheck, CreditCard, Undo2 } from "lucide-react";

export function SubnavCompras() {
  const pathname = usePathname();

  const links = [
    {
      href: "/compras",
      exact: true,
      label: "Facturas y Compras",
      icono: ShoppingCart,
    },
    {
      href: "/compras/pedidos",
      exact: false,
      label: "Pedidos de Compra",
      icono: ClipboardList,
    },
    {
      href: "/compras/recepciones",
      exact: false,
      label: "Recepciones de Mercancía",
      icono: PackageCheck,
    },
    {
      href: "/compras/cuentas-por-pagar",
      exact: false,
      label: "Cuentas por Pagar",
      icono: CreditCard,
    },
    {
      href: "/compras/devoluciones",
      exact: false,
      label: "Devoluciones a Proveedores",
      icono: Undo2,
    },
  ];

  return (
    <div className="mb-6 border-b border-slate-200">
      <nav className="-mb-px flex flex-wrap gap-2 sm:gap-6 overflow-x-auto">
        {links.map((link) => {
          const Icon = link.icono;
          const isActive = link.exact
            ? pathname === link.href
            : pathname === link.href || (pathname.startsWith(link.href) && pathname !== "/compras");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-2 border-b-2 py-3 px-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? "border-amber-500 text-amber-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Icon size={16} className={isActive ? "text-amber-600" : "text-slate-400"} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
