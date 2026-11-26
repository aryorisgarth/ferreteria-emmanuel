import Link from "next/link";
import { TrendingUp, Wallet } from "lucide-react";
import { dinero } from "@/lib/format";

export function PanelFinancieroInicio({ resumen }: { resumen: any }) {
  const ventasNetas = dinero(resumen.subtotalDia ?? resumen.ventas);
  const costoHoy = dinero(resumen.costoHoy ?? 0);
  const utilidadBruta = dinero(resumen.utilidadBrutaDia ?? (resumen.ventas - resumen.costoHoy));
  const utilidadNeta = dinero(resumen.utilidadNetaDia ?? resumen.utilidad);
  const utilidadMes = dinero(resumen.utilidadBrutaMes ?? 0);

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-3">
      {/* Panel Financiero */}
      <div className="bg-slate-900 text-white rounded-md p-5 border border-slate-800 lg:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-200 text-xs font-bold uppercase tracking-wider">
              <TrendingUp size={15} className="text-blue-400" />
              Margen y Rentabilidad del Período
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Costo histórico Kárdex</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ventas Netas</p>
              <p className="text-lg font-bold font-mono text-white mt-0.5">{ventasNetas}</p>
              <p className="text-[10px] text-slate-500">Sin incluir IVA</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Costo Mercadería</p>
              <p className="text-lg font-bold font-mono text-rose-300 mt-0.5">{costoHoy}</p>
              <p className="text-[10px] text-slate-500">CPP Ponderado</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Utilidad Bruta</p>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{utilidadBruta}</p>
              <p className="text-[10px] text-slate-500">Ventas − Costo</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Utilidad Neta</p>
              <p className="text-lg font-bold font-mono text-blue-400 mt-0.5">{utilidadNeta}</p>
              <p className="text-[10px] text-slate-500">Turno de caja</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Mes acumulado: <strong className="text-white">{utilidadMes}</strong> Utilidad Bruta</span>
          <Link href="/reportes" className="text-blue-400 hover:text-blue-300 hover:underline">Informe detallado →</Link>
        </div>
      </div>

      {/* Estado del Turno de Caja */}
      <div className="card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Wallet size={15} className="text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Estado de Caja</h3>
            </div>
            {resumen.turno ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● ABIERTA
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                CERRADA
              </span>
            )}
          </div>

          {resumen.turno ? (
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Cajero en turno:</span>
                <span className="font-bold text-slate-800">{resumen.turno.usuario}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Fondo Inicial:</span>
                <span className="font-mono font-semibold text-slate-800">{dinero(resumen.turno.montoInicial)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ventas Efectivo:</span>
                <span className="font-mono font-bold text-emerald-600">{dinero(resumen.turno.totalVentasEfectivo || 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Gastos Registrados:</span>
                <span className="font-mono font-bold text-rose-600">{dinero(resumen.turno.totalEgresos || 0)}</span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400">
              <Wallet size={20} className="mx-auto mb-1 opacity-30" />
              <p className="text-xs">No hay un turno de caja activo actualmente.</p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {resumen.turno ? (
            <>
              <span className="text-slate-400 font-medium">Operación en curso</span>
              <Link href="/total-del-dia" className="font-bold text-slate-700 hover:text-slate-900 transition">
                Ver Arqueo →
              </Link>
            </>
          ) : (
            <Link href="/caja" className="w-full btn btn-navy h-8 text-xs font-bold justify-center">
              Abrir Turno de Caja
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
