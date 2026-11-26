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
        className="card p-4 hover:border-slate-400 transition flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
            <Receipt size={17} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cuentas por Cobrar (Créditos)</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{dinero(porCobrar)}</p>
            <p className="text-[11px] text-slate-400">Facturas a crédito pendientes</p>
          </div>
        </div>
        <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-700 transition" />
      </Link>

      <Link
        href="/compras/cuentas-por-pagar"
        className="card p-4 hover:border-slate-400 transition flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold border border-slate-200">
            <Truck size={17} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cuentas por Pagar (Proveedores)</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{dinero(porPagar)}</p>
            <p className="text-[11px] text-slate-400">Compras pendientes de pago</p>
          </div>
        </div>
        <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-700 transition" />
      </Link>
    </div>
  );
}
