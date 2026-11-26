"use client";

import { Save } from "lucide-react";
import { guardarConfiguracionGeneralAction } from "@/app/actions";
import type { ConfiguracionSistema } from "@/lib/config";

interface ConfiguracionMonedaImpuestoProps {
  moneda: ConfiguracionSistema["moneda"];
  impuesto: ConfiguracionSistema["impuesto"];
}

export function ConfiguracionMonedaImpuesto({ moneda, impuesto }: ConfiguracionMonedaImpuestoProps) {
  return (
    <form action={guardarConfiguracionGeneralAction} className="space-y-6">
      <input type="hidden" name="seccion" value="moneda_impuesto" />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900">Moneda Oficial e Impuestos de Venta</h3>
          <p className="text-xs text-slate-500">
            Configura el signo monetario (Córdobas C$ / Dólares $) y el porcentaje de IVA aplicable a las ventas.
          </p>
        </div>

        {/* Configuración de Moneda */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nombre de la Moneda
            </label>
            <input
              type="text"
              name="monedaNombre"
              defaultValue={moneda.nombre || "Córdoba Nicaragüense"}
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Símbolo Monetario <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              name="monedaSimbolo"
              required
              defaultValue={moneda.simbolo || "C$"}
              placeholder="C$"
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-mono font-black text-slate-900 outline-none focus:border-brand-yellow focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Código ISO
            </label>
            <input
              type="text"
              name="monedaCodigo"
              defaultValue={moneda.codigo || "NIO"}
              placeholder="NIO"
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-mono text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
            />
          </div>
        </div>

        {/* Configuración de Impuesto (I.V.A.) */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Parámetros Fiscales del Impuesto
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nombre del Impuesto en Facturas
              </label>
              <input
                type="text"
                name="impuestoNombre"
                defaultValue={impuesto.nombre || "I.V.A."}
                placeholder="I.V.A."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-yellow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tasa de Impuesto (%) <span className="text-amber-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  name="impuestoPorcentaje"
                  required
                  defaultValue={impuesto.porcentaje ?? 15}
                  className="h-10 w-32 rounded-lg border border-slate-300 bg-white px-3 text-sm font-mono font-bold text-slate-900 outline-none focus:border-brand-yellow"
                />
                <span className="text-sm font-bold text-slate-500">%</span>
                <span className="text-xs text-slate-400 pl-2">
                  (Nicaragua: 15% por defecto. Escribe 0 si tus ventas son exentas).
                </span>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              name="aplicarPorDefecto"
              defaultChecked={impuesto.aplicarPorDefecto !== false}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            Aplicar IVA automáticamente al subtotal en la Caja y Facturas
          </label>
        </div>

        <div className="flex items-center justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-2 shadow-xs"
          >
            <Save size={16} />
            Guardar Moneda e Impuestos
          </button>
        </div>
      </div>
    </form>
  );
}
