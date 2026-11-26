import Link from "next/link";
import { ExternalLink, FileCheck2, Printer } from "lucide-react";
import { fechaCorta } from "@/lib/format";
import type { ActaFila } from "@/lib/inventory/modelos";

export function TablaActas({ filas }: { filas: ActaFila[] }) {
  if (filas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400 shadow-xs">
        <FileCheck2 size={36} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">No se encontraron actas de entrega registradas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="tabla w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Acta No.</th>
              <th className="py-3.5 px-4">Fecha Emisión</th>
              <th className="py-3.5 px-4">Destinatario / Receptor</th>
              <th className="py-3.5 px-4">Dependencia / Obra</th>
              <th className="py-3.5 px-4">Documento Origen</th>
              <th className="py-3.5 px-4 text-center">Estado Kárdex</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((fila) => (
              <tr key={fila.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-slate-900">
                  <Link className="hover:text-amber-600 transition" href={`/actas/${fila.id}`}>
                    {fila.numero}
                  </Link>
                </td>
                <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                  {fechaCorta(fila.fecha)}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900 text-xs sm:text-sm">
                  {fila.destinatario}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-600">
                  {fila.oficinaNombre}
                </td>
                <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                  {fila.esSalidaDirecta ? (
                    <span className="font-semibold text-slate-700">Salida Directa</span>
                  ) : (
                    fila.solicitudNumero || "—"
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      fila.ejecutada
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {fila.ejecutada ? "Descontado de Kárdex" : "Emitida sin descargo"}
                  </span>
                </td>
                <td className="py-3.5 px-4 sm:px-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-1"
                      href={`/actas/${fila.id}`}
                    >
                      Ver
                      <ExternalLink size={11} className="opacity-40" />
                    </Link>
                    <Link
                      className="rounded-lg border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-900 transition"
                      href={`/actas/${fila.id}/imprimir`}
                      title="Imprimir Acta Oficial"
                    >
                      <Printer size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
