"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ClipboardList, Search, TrendingDown, TrendingUp } from "lucide-react";
import { dinero, etiquetaUnidad, numero } from "@/lib/format";
import type { AjusteInventario, ProductoVista } from "@/lib/types";

interface PestanaAjustesProps {
  ajustesIniciales: AjusteInventario[];
  productosIniciales: ProductoVista[];
}

export function PestanaAjustes({
  ajustesIniciales,
  productosIniciales,
}: PestanaAjustesProps) {
  const [filtroAjustes, setFiltroAjustes] = useState("");

  const ajustesFiltrados = useMemo(() => {
    const term = filtroAjustes.trim().toLowerCase();
    if (!term) return ajustesIniciales;
    return ajustesIniciales.filter((a) => {
      const prod = productosIniciales.find((p) => p.id === a.productoId);
      return (
        a.numero.toLowerCase().includes(term) ||
        a.tipo.toLowerCase().includes(term) ||
        a.motivo.toLowerCase().includes(term) ||
        a.usuario.toLowerCase().includes(term) ||
        (prod && (prod.codigo.toLowerCase().includes(term) || prod.nombre.toLowerCase().includes(term)))
      );
    });
  }, [ajustesIniciales, productosIniciales, filtroAjustes]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Historial de Ajustes de Inventario</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro formal de sobrantes, faltantes, mermas, daños y correcciones. Cada ajuste afecta el Kárdex de forma trazable.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={filtroAjustes}
            onChange={(e) => setFiltroAjustes(e.target.value)}
            placeholder="Buscar por folio, artículo, motivo..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-brand-yellow"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 sm:px-6">Folio / Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Artículo</th>
                <th className="py-3 px-4 text-center">Cantidad</th>
                <th className="py-3 px-4 text-right">Costo Unit.</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4">Motivo / Justificación</th>
                <th className="py-3 px-4 sm:px-6 text-right">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ajustesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ArrowUpDown size={32} className="mx-auto mb-2 opacity-40" />
                    No hay ajustes de inventario registrados.
                  </td>
                </tr>
              ) : (
                ajustesFiltrados.map((a) => {
                  const prod = productosIniciales.find((p) => p.id === a.productoId);
                  const esEntrada = a.signo === 1;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900 block">{a.numero}</span>
                        <span className="text-[11px] text-slate-400">{a.fecha}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            a.tipo === "SOBRANTE"
                              ? "bg-emerald-100 text-emerald-800"
                              : a.tipo === "FALTANTE"
                              ? "bg-rose-100 text-rose-800"
                              : a.tipo === "DANO"
                              ? "bg-amber-100 text-amber-800"
                              : a.tipo === "MERMA"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {esEntrada ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {a.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-mono text-xs font-bold text-slate-700 block">{prod?.codigo ?? "—"}</span>
                        <span className="text-xs text-slate-900 font-medium line-clamp-1">
                          {prod?.nombre ?? "Artículo no encontrado"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">
                        <span className={esEntrada ? "text-emerald-700" : "text-rose-700"}>
                          {esEntrada ? "+" : "-"}
                          {numero(a.cantidad)} {prod ? etiquetaUnidad(prod.unidadMedida) : ""}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Prev: {numero(a.stockPrevio)} → Nuevo: {numero(a.stockNuevo)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-600">
                        {dinero(a.costoUnitario)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-900">
                        {dinero(a.valorTotal)}
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <p className="text-xs text-slate-700">{a.motivo}</p>
                        {a.conteoId && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold mt-0.5">
                            <ClipboardList size={11} /> Conteo Físico
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-right text-xs text-slate-500 whitespace-nowrap font-medium">
                        {a.usuario}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
