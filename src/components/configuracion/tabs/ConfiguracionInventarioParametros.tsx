"use client";

import React, { useState } from "react";
import { Boxes, ShieldCheck, AlertTriangle } from "lucide-react";

export function ConfiguracionInventarioParametros() {
  const [stockMinimoDefault, setStockMinimoDefault] = useState(5);
  const [ocultarCostosVendedores, setOcultarCostosVendedores] = useState(true);
  const [bloquearVentaSinStock, setBloquearVentaSinStock] = useState(true);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Boxes size={16} className="text-slate-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Políticas de Inventario y Control de Bodega
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Parámetros Globales</span>
        </div>

        <div className="space-y-4">
          <div className="max-w-xs space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Stock Mínimo Predeterminado para Alertas
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="500"
                value={stockMinimoDefault}
                onChange={(e) => setStockMinimoDefault(Number(e.target.value))}
                className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:border-slate-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500">unidades</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Genera alerta de reabastecimiento en el kárdex y centro de reportes.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={ocultarCostosVendedores}
                onChange={(e) => setOcultarCostosVendedores(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Ocultar Costos de Adquisición y Márgenes a Vendedores y Cajeros
                </span>
                <p className="text-[11px] text-slate-500">
                  Solo el Administrador tendrá acceso a la visualización de costos netos de compra y márgenes brutos.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={bloquearVentaSinStock}
                onChange={(e) => setBloquearVentaSinStock(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Prevenir Venta con Saldo Negativo de Inventario
                </span>
                <p className="text-[11px] text-slate-500">
                  Evita que se generen ventas si la cantidad solicitada excede la existencia real registrada en bodega.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
