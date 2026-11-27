import Link from "next/link";
import { ChevronRight, Receipt, Truck } from "lucide-react";
import { dinero } from "@/lib/format";

export function CarteraCreditosInicio({
  porCobrar,
  porPagar,
}: {
  porCobrar: number;
  porPagar: number;
}) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <Link
        href="/cobranza"
        className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-4 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all duration-150 active:scale-[0.98] flex items-center justify-between group"
      >
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200/70 shadow-2xs">
            <Receipt size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cuentas por Cobrar (Créditos)</p>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{dinero(porCobrar)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Facturas a crédito pendientes</p>
          </div>
        </div>
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-slate-300 group-hover:text-slate-600 group-hover:bg-slate-100 transition">
          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition" />
        </div>
      </Link>

      <Link
        href="/compras/cuentas-por-pagar"
        className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-4 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all duration-150 active:scale-[0.98] flex items-center justify-between group"
      >
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold border border-slate-200/70 shadow-2xs">
            <Truck size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cuentas por Pagar (Proveedores)</p>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{dinero(porPagar)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Compras pendientes de pago</p>
          </div>
        </div>
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-slate-300 group-hover:text-slate-600 group-hover:bg-slate-100 transition">
          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition" />
        </div>
      </Link>
    </div>
  );
}
