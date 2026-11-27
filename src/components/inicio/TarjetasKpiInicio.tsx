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
            className="rounded-2xl p-3.5 sm:p-4 transition-all duration-150 border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs hover:shadow-sm hover:border-slate-300 active:scale-[0.98] group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className={`inline-flex rounded-xl p-2 shadow-2xs ${tarjeta.badgeClase}`}>
                <Icono size={17} className="sm:w-[18px] sm:h-[18px]" />
              </span>
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-slate-300 group-hover:text-slate-600 group-hover:bg-slate-100 transition">
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                {tarjeta.valor}
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                {tarjeta.label}
              </p>
              <p className="hidden sm:block mt-1 text-[11px] text-slate-400 font-medium truncate">{tarjeta.detalle}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
