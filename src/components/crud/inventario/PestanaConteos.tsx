"use client";

import { CheckCircle2, Clock, Eye, Plus, ClipboardList } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { aplicarConteoFisicoAction } from "@/app/actions";
import type { ConteoFisico } from "@/lib/types";

interface PestanaConteosProps {
  conteosIniciales: ConteoFisico[];
  onIniciarConteo: () => void;
  onVerDetalle: (conteo: ConteoFisico) => void;
}

export function PestanaConteos({
  conteosIniciales,
  onIniciarConteo,
  onVerDetalle,
}: PestanaConteosProps) {
  const { toast, confirmar } = useToast();

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Levantamientos de Conteo Físico</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Al guardar el conteo queda como borrador sin afectar existencias. Al aplicarlo se concilian las diferencias automáticamente en Kárdex.
          </p>
        </div>
        <button
          type="button"
          onClick={onIniciarConteo}
          className="btn btn-amarillo h-9 px-4 text-xs font-bold gap-1.5 shadow-xs shrink-0"
        >
          <Plus size={15} />
          Iniciar Conteo Físico
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 sm:px-6">Folio / Fecha</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4 text-center">Artículos Contados</th>
                <th className="py-3 px-4 text-center">Diferencias Detectadas</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Notas</th>
                <th className="py-3 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conteosIniciales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ClipboardList size={32} className="mx-auto mb-2 opacity-40" />
                    No se han registrado conteos físicos de inventario.
                  </td>
                </tr>
              ) : (
                conteosIniciales.map((c) => {
                  const totalDiffs = c.items.filter((it) => Math.abs(it.diferencia) > 0.0001).length;
                  const esBorrador = c.estado === "BORRADOR";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900 block">{c.numero}</span>
                        <span className="text-[11px] text-slate-400">{c.fecha}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {c.usuario}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs font-bold text-slate-700">
                        {c.items.length}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {totalDiffs > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-bold">
                            {totalDiffs} artículo{totalDiffs > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Exacto (0)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            esBorrador
                              ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {esBorrador ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                          {c.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-xs text-slate-600 truncate">{c.notas || "—"}</td>
                      <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onVerDetalle(c)}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                          >
                            <Eye size={13} /> Ver Detalle
                          </button>

                          {esBorrador && (
                            <button
                              type="button"
                              onClick={() => {
                                confirmar({
                                  titulo: `¿Aplicar Conteo Físico ${c.numero}?`,
                                  mensaje:
                                    "Esta acción generará automáticamente los ajustes de sobrante y faltante en Kárdex para conciliar el inventario al stock físico real.",
                                  textoConfirmar: "Aplicar y Conciliar Stock",
                                  tono: "azul",
                                  onConfirmar: async () => {
                                    const formData = new FormData();
                                    formData.append("conteoId", c.id);
                                    await aplicarConteoFisicoAction(formData);
                                    toast.exito(`Conteo ${c.numero} aplicado y conciliado exitosamente.`);
                                  },
                                });
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                            >
                              <CheckCircle2 size={13} /> Aplicar
                            </button>
                          )}
                        </div>
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
