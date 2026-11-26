import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export interface TarjetaKpiItem {
  href: string;
  label: string;
  valor: string;
  detalle: string;
  icono: LucideIcon;
  badgeClase: string;
}

export function TarjetasKpiInicio({ tarjetas }: { tarjetas: TarjetaKpiItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {tarjetas.map((tarjeta) => {
        const Icono = tarjeta.icono;
        return (
          <Link
            key={tarjeta.label}
            href={tarjeta.href}
            className="card p-3 sm:p-4 transition hover:border-slate-400 group"
          >
            <div className="flex items-center justify-between">
              <span className={`inline-flex rounded p-1.5 sm:p-2 ${tarjeta.badgeClase}`}>
                <Icono size={16} className="sm:w-[17px] sm:h-[17px]" />
              </span>
              <ChevronRight
                size={14}
                className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition"
              />
            </div>
            <p className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {tarjeta.valor}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              {tarjeta.label}
            </p>
            <p className="hidden sm:block mt-1 text-[11px] text-slate-400 truncate">{tarjeta.detalle}</p>
          </Link>
        );
      })}
    </div>
  );
}
