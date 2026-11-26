"use client";

import React from "react";
import { Printer, Barcode, CheckCircle2, RotateCcw } from "lucide-react";
import { useConfiguracionDispositivo } from "../hooks/useConfiguracionDispositivo";

export function ConfiguracionDispositivoHardware() {
  const {
    configDispositivo,
    guardadoExitoso,
    actualizarDispositivo,
    restaurarDispositivo,
  } = useConfiguracionDispositivo();

  return (
    <div className="space-y-5">
      {guardadoExitoso && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span>Configuración de este equipo guardada localmente.</span>
        </div>
      )}

      <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Printer size={16} className="text-slate-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Terminal Física de Impresión (Estación Actual)
            </h3>
          </div>
          <button
            type="button"
            onClick={restaurarDispositivo}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
          >
            <RotateCcw size={12} />
            Restablecer equipo
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Formato de Ticket para esta Estación
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "80mm", titulo: "Térmica 80 mm", desc: "Estándar de caja mostrador" },
                { id: "58mm", titulo: "Térmica 58 mm", desc: "Ticketera compacta USB/BT" },
                { id: "carta", titulo: "Página Carta", desc: "Impresora láser o inyección" },
              ].map((fmt) => (
                <div
                  key={fmt.id}
                  onClick={() =>
                    actualizarDispositivo({ formatoTicket: fmt.id as any })
                  }
                  className={`rounded-md border p-3 cursor-pointer transition-all ${
                    configDispositivo.formatoTicket === fmt.id
                      ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900/10"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {fmt.titulo}
                    </span>
                    {configDispositivo.formatoTicket === fmt.id && (
                      <CheckCircle2 size={13} className="text-slate-900" />
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">{fmt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={configDispositivo.impresionAutomatica}
                onChange={(e) =>
                  actualizarDispositivo({ impresionAutomatica: e.target.checked })
                }
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Lanzar Impresión Automática al Cobrar en Mostrador (F9)
                </span>
                <p className="text-[11px] text-slate-500">
                  Abre directamente la orden de impresión del navegador tras registrar la venta.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={configDispositivo.sonidoLectura}
                onChange={(e) =>
                  actualizarDispositivo({ sonidoLectura: e.target.checked })
                }
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Pitido de Confirmación con Escáner de Código de Barras
                </span>
                <p className="text-[11px] text-slate-500">
                  Genera una señal auditiva breve cuando el lector detecta y añade un producto a la venta.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
