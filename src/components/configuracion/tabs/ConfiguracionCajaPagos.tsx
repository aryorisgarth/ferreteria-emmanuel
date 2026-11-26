"use client";

import React, { useState } from "react";
import { CreditCard, ShieldAlert, Building, CheckCircle2 } from "lucide-react";

export function ConfiguracionCajaPagos() {
  const [politicaAActiva, setPoliticaAActiva] = useState(true);
  const [cuentaPrincipal, setCuentaPrincipal] = useState("BAC");

  return (
    <div className="space-y-6">
      {/* Política A de Seguridad Financiera */}
      <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Política A — Verificación Obligatoria de Transferencias
              </h3>
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                Regla Fiscal y de Caja
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Las transferencias bancarias deben ser verificadas y confirmadas
              por el propietario antes de registrar la venta como cobrada,
              emitir la factura formal o entregar mercancía en bodega.
            </p>
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={politicaAActiva}
                  onChange={(e) => setPoliticaAActiva(e.target.checked)}
                  className="rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                />
                Exigir validación previa del propietario en pagos con transferencia
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Cuentas Bancarias Comerciales */}
      <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building size={16} className="text-slate-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cuentas Bancarias Comerciales de Recepción
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Ferretería Emmanuel
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              banco: "BAC Credomatic",
              cuenta: "360-123456-7 (Córdobas NIO)",
              titular: "Ferretería Emmanuel S.A.",
              id: "BAC",
            },
            {
              banco: "Banco de la Producción (BANPRO)",
              cuenta: "1002-987654-0 (Córdobas NIO)",
              titular: "Ferretería Emmanuel S.A.",
              id: "BANPRO",
            },
            {
              banco: "Banco LAFISE Bancentro",
              cuenta: "450-789012-3 (Córdobas NIO)",
              titular: "Ferretería Emmanuel S.A.",
              id: "LAFISE",
            },
            {
              banco: "Banco de Finanzas (BDF)",
              cuenta: "210-654321-9 (Dólares USD)",
              titular: "Ferretería Emmanuel S.A.",
              id: "BDF",
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setCuentaPrincipal(item.id)}
              className={`rounded-md border p-3 cursor-pointer transition-all ${
                cuentaPrincipal === item.id
                  ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900/10"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {item.banco}
                </span>
                {cuentaPrincipal === item.id && (
                  <CheckCircle2 size={13} className="text-slate-900" />
                )}
              </div>
              <p className="mt-1 font-mono text-[11px] font-semibold text-slate-600">
                {item.cuenta}
              </p>
              <p className="text-[10px] text-slate-400">{item.titular}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
