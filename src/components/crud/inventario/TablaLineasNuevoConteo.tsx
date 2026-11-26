"use client";

import { etiquetaUnidad, numero } from "@/lib/format";
import type { LineaNuevoConteo } from "./tipos";

interface TablaLineasNuevoConteoProps {
  conteoLineas: LineaNuevoConteo[];
  onCambioConteo: (idx: number, valor: number) => void;
  onCambioObservacion: (idx: number, texto: string) => void;
}

export function TablaLineasNuevoConteo({
  conteoLineas,
  onCambioConteo,
  onCambioObservacion,
}: TablaLineasNuevoConteoProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Artículo</th>
              <th className="py-2.5 px-3 text-center">Stock Sistema</th>
              <th className="py-2.5 px-3 text-center w-32">Conteo Físico Real</th>
              <th className="py-2.5 px-3 text-center">Diferencia</th>
              <th className="py-2.5 px-3">Observación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {conteoLineas.map((linea, idx) => {
              const diff = Number(linea.conteoFisico) - linea.stockSistema;
              return (
                <tr key={linea.productoId} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3">
                    <span className="font-mono text-slate-500 text-[11px] block">{linea.codigo}</span>
                    <span className="text-slate-900 font-semibold line-clamp-1">{linea.nombre}</span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-600">
                    {numero(linea.stockSistema)} {etiquetaUnidad(linea.unidadMedida)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={linea.conteoFisico}
                      onChange={(e) => onCambioConteo(idx, Math.max(0, Number(e.target.value) || 0))}
                      className="h-8 w-24 text-center rounded border border-slate-300 bg-white px-2 font-mono text-xs font-bold text-slate-900 outline-none focus:border-brand-yellow"
                    />
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold">
                    {Math.abs(diff) < 0.0001 ? (
                      <span className="text-slate-400">0</span>
                    ) : diff > 0 ? (
                      <span className="text-emerald-600">+{numero(diff)} (Sobrante)</span>
                    ) : (
                      <span className="text-rose-600">{numero(diff)} (Faltante)</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={linea.observacion}
                      onChange={(e) => onCambioObservacion(idx, e.target.value)}
                      placeholder="Obs..."
                      className="h-8 w-full rounded border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
