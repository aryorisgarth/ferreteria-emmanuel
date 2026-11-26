"use client";

import { useEffect, useState } from "react";
import { Clock, Save } from "lucide-react";
import { guardarConfiguracionGeneralAction } from "@/app/actions";
import type { ConfiguracionSistema } from "@/lib/config";

interface ConfiguracionHoraProps {
  sistema: ConfiguracionSistema["sistema"];
}

export function ConfiguracionHora({ sistema }: ConfiguracionHoraProps) {
  const [horaLocal, setHoraLocal] = useState("");

  useEffect(() => {
    const act = () => {
      const ahora = new Date();
      setHoraLocal(
        ahora.toLocaleTimeString("es-NI", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: sistema.zonaHoraria || "America/Managua",
        }),
      );
    };
    act();
    const interval = setInterval(act, 1000);
    return () => clearInterval(interval);
  }, [sistema.zonaHoraria]);

  return (
    <form action={guardarConfiguracionGeneralAction} className="space-y-6">
      <input type="hidden" name="seccion" value="sistema" />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hora del Sistema y Zona Horaria</h3>
            <p className="text-xs text-slate-500">
              Garantiza que cada factura y movimiento de kárdex lleve la estampa exacta de tiempo de Nicaragua.
            </p>
          </div>

          {/* Reloj en Vivo */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 text-brand-bright px-4 py-2 border border-slate-800">
            <Clock size={16} className="text-brand-yellow animate-pulse" />
            <span className="font-mono text-base font-bold tracking-wider">{horaLocal}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Zona Horaria Oficial
            </label>
            <select
              name="zonaHoraria"
              defaultValue={sistema.zonaHoraria || "America/Managua"}
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
            >
              <option value="America/Managua">Nicaragua (GMT-6 Managua)</option>
              <option value="America/Tegucigalpa">Centroamérica (GMT-6)</option>
              <option value="America/Costa_Rica">Costa Rica (GMT-6)</option>
              <option value="America/Panama">Panamá (GMT-5)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Formato de Fecha en Pantalla
            </label>
            <select
              name="formatoFecha"
              defaultValue={sistema.formatoFecha || "DD/MM/YYYY"}
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Ej. 03/11/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (Estándar ISO)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-2 shadow-xs"
          >
            <Save size={16} />
            Guardar Ajustes de Hora
          </button>
        </div>
      </div>
    </form>
  );
}
