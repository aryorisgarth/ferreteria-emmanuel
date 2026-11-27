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
      {/* Panel Financiero - Glassmorphism Suave tipo iOS */}
      <div
        className="rounded-2xl p-4 sm:p-5 border lg:col-span-2 flex flex-col justify-between shadow-xs transition-all backdrop-blur-md"
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, var(--theme-accent-light) 100%)",
          borderColor: "var(--theme-accent-border)",
        }}
      >
        <div>
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--theme-accent-border)" }}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--theme-header-text)" }}>
              <TrendingUp size={16} style={{ color: "var(--theme-primary)" }} />
              Margen y Rentabilidad del Período
            </div>
            <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/70 shadow-2xs">
              Costo histórico Kárdex
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-white/85 p-3 rounded-xl border border-slate-200/70 shadow-2xs backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ventas Netas</p>
              <p className="text-lg font-black font-mono text-slate-900 mt-0.5">{ventasNetas}</p>
              <p className="text-[10px] text-slate-400">Sin incluir IVA</p>
            </div>
            <div className="bg-white/85 p-3 rounded-xl border border-slate-200/70 shadow-2xs backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Costo Mercadería</p>
              <p className="text-lg font-black font-mono text-rose-600 mt-0.5">{costoHoy}</p>
              <p className="text-[10px] text-slate-400">CPP Ponderado</p>
            </div>
            <div className="bg-white/85 p-3 rounded-xl border border-slate-200/70 shadow-2xs backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Utilidad Bruta</p>
              <p className="text-lg font-black font-mono text-emerald-600 mt-0.5">{utilidadBruta}</p>
              <p className="text-[10px] text-slate-400">Ventas − Costo</p>
            </div>
            <div className="bg-white/85 p-3 rounded-xl border border-slate-200/70 shadow-2xs backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Utilidad Neta</p>
              <p className="text-lg font-black font-mono mt-0.5" style={{ color: "var(--theme-primary)" }}>{utilidadNeta}</p>
              <p className="text-[10px] text-slate-400">Turno de caja</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t text-[11px] flex items-center justify-between" style={{ borderColor: "var(--theme-accent-border)" }}>
          <span className="text-slate-600">
            Mes acumulado: <strong className="text-slate-900">{utilidadMes}</strong> Utilidad Bruta
          </span>
          <Link
            href="/reportes"
            className="font-bold hover:underline transition"
            style={{ color: "var(--theme-primary)" }}
          >
            Informe detallado →
          </Link>
        </div>
      </div>

      {/* Estado del Turno de Caja - Glassmorphism Suave tipo iOS */}
      <div
        className="rounded-2xl p-4 sm:p-5 border flex flex-col justify-between shadow-xs transition-all bg-white/95 backdrop-blur-md"
        style={{ borderColor: "var(--theme-accent-border)" }}
      >
        <div>
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--theme-accent-border)" }}>
            <div className="flex items-center gap-2">
              <Wallet size={16} style={{ color: "var(--theme-primary)" }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--theme-header-text)" }}>
                Estado de Caja
              </h3>
            </div>
            {resumen.turno ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ● ABIERTA
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                CERRADA
              </span>
            )}
          </div>

          {resumen.turno ? (
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cajero en turno:</span>
                <span className="font-bold text-slate-800">{resumen.turno.usuario}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Fondo Inicial:</span>
                <span className="font-mono font-semibold text-slate-800">{dinero(resumen.turno.montoInicial)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
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

        <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--theme-accent-border)" }}>
          {resumen.turno ? (
            <>
              <span className="text-slate-400 font-medium">Operación en curso</span>
              <Link href="/total-del-dia" className="font-bold hover:underline transition" style={{ color: "var(--theme-primary)" }}>
                Ver Arqueo →
              </Link>
            </>
          ) : (
            <Link
              href="/caja"
              className="w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99] cursor-pointer"
              style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-primary-contrast)" }}
            >
              Abrir Turno de Caja
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
