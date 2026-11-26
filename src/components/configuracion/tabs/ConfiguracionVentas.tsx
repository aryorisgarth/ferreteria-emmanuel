"use client";

import { Save } from "lucide-react";
import { guardarConfiguracionGeneralAction } from "@/app/actions";
import type { ConfiguracionSistema } from "@/lib/config";

interface ConfiguracionVentasProps {
  ventas: ConfiguracionSistema["ventas"];
}

export function ConfiguracionVentas({ ventas }: ConfiguracionVentasProps) {
  return (
    <form action={guardarConfiguracionGeneralAction} className="space-y-6">
      <input type="hidden" name="seccion" value="ventas" />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900">Políticas de Cotizaciones y Crédito Fiado</h3>
          <p className="text-xs text-slate-500">
            Reglas comerciales aplicadas al cotizar a contratistas o autorizar crédito.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Días de Validez de las Cotizaciones
            </label>
            <input
              type="number"
              name="diasValidezCotizacion"
              defaultValue={ventas.diasValidezCotizacion || 15}
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Tiempo en que se sostiene el precio cotizado al cliente.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Límite Máximo de Días para Fiado / Crédito
            </label>
            <input
              type="number"
              name="diasCreditoMaximo"
              defaultValue={ventas.diasCreditoMaximo || 30}
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-mono font-bold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Plazo estándar para cobrar facturas pendientes a constructores.
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Términos y Condiciones Legales de Cotización
          </label>
          <textarea
            name="terminosCotizacion"
            rows={3}
            defaultValue={ventas.terminosCotizacion}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-2 shadow-xs"
          >
            <Save size={16} />
            Guardar Políticas de Venta
          </button>
        </div>
      </div>
    </form>
  );
}
