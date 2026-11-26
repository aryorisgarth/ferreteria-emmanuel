"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Package, Receipt, FileText, Settings, X, ArrowRight } from "lucide-react";

interface Props {
  abierto: boolean;
  busqueda: string;
  setBusqueda: (val: string) => void;
  onCerrar: () => void;
}

const ACCESOS_RAPIDOS = [
  { href: "/caja", label: "Punto de Venta (POS)", desc: "Cobro rápido en mostrador [F1]", icon: ShoppingCart },
  { href: "/inventario", label: "Catálogo de Artículos", desc: "Precios, stock y categorías", icon: Package },
  { href: "/facturas", label: "Historial de Facturas", desc: "Comprobantes y devoluciones", icon: Receipt },
  { href: "/cotizaciones", label: "Cotizaciones", desc: "Presupuestos a clientes", icon: FileText },
  { href: "/configuracion", label: "Configuración General", desc: "Empresa, temas y parámetros", icon: Settings },
];

export function ModalBusquedaGlobal({ abierto, busqueda, setBusqueda, onCerrar }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [abierto]);

  if (!abierto) return null;

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim()) {
      router.push(`/inventario?q=${encodeURIComponent(busqueda.trim())}`);
      onCerrar();
    }
  };

  const handleNavegar = (href: string) => {
    router.push(href);
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onCerrar} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <form onSubmit={handleBuscar} className="relative flex items-center border-b border-slate-200 px-4 py-3 bg-slate-50/50">
          <Search size={18} className="text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, nombre o presiona Enter para ver catálogo..."
            className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda("")} className="p-1 text-slate-400 hover:text-slate-600 mr-1 cursor-pointer">
              <X size={15} />
            </button>
          )}
          <button type="button" onClick={onCerrar} className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-200/80 rounded hover:bg-slate-300 transition cursor-pointer">
            Esc
          </button>
        </form>

        <div className="p-3 sm:p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {busqueda.trim() ? (
            <div className="p-2">
              <button
                type="button"
                onClick={handleBuscar}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-950 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-bold shrink-0">
                    <Search size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Buscar en inventario: &quot;{busqueda.trim()}&quot;</p>
                    <p className="text-[11px] text-amber-800">Ver coincidencias de artículos y existencias</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-amber-700 shrink-0" />
              </button>
            </div>
          ) : (
            <div>
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Accesos Directos del Sistema
              </p>
              <div className="grid grid-cols-1 gap-1">
                {ACCESOS_RAPIDOS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleNavegar(item.href)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-white text-slate-700 border border-slate-200 shrink-0">
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.label}</p>
                          <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-700 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Atajo rápido: Presiona <kbd className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px]">Enter</kbd> para buscar</span>
          <span className="hidden sm:inline">Navegación instantánea Ferretería Emmanuel</span>
        </div>
      </div>
    </div>
  );
}
