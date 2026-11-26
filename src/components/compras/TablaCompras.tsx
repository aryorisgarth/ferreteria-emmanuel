import Link from "next/link";
import { Truck } from "lucide-react";
import { dinero, fechaCorta } from "@/lib/format";
import type { Compra } from "@/lib/types";

export interface FilaResumenCompra {
  compra: Compra;
  total: number;
}

export function TablaCompras({ filas, simbolo }: { filas: FilaResumenCompra[]; simbolo: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="tabla w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Folio / Factura</th>
              <th className="py-3.5 px-4">Distribuidor / Proveedor</th>
              <th className="py-3.5 px-4">Fecha</th>
              <th className="py-3.5 px-4">Condición</th>
              <th className="py-3.5 px-4 text-center">Estado Kárdex</th>
              <th className="py-3.5 px-4 text-right">Total ({simbolo})</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <Truck size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No se encontraron compras registradas.</p>
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.compra.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-slate-900">
                    <Link className="hover:text-amber-600 transition" href={`/compras/${fila.compra.id}`}>
                      {fila.compra.numero}
                    </Link>
                    {fila.compra.facturaProveedor && (
                      <p className="text-[10px] text-slate-400 font-normal">Fact: {fila.compra.facturaProveedor}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs sm:text-sm">
                    {fila.compra.proveedor}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600">{fechaCorta(fila.compra.fecha)}</td>
                  <td className="py-3.5 px-4 text-xs">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        fila.compra.condicionPago === "CREDITO"
                          ? fila.compra.estadoPago === "PAGADO"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {fila.compra.condicionPago === "CREDITO"
                        ? `Crédito (${fila.compra.estadoPago ?? "PENDIENTE"})`
                        : "Contado"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        fila.compra.anulada ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {fila.compra.anulada ? "Anulada" : "Stock Incrementado"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {dinero(fila.total, simbolo)}
                    {fila.compra.condicionPago === "CREDITO" && (fila.compra.saldoPendiente ?? 0) > 0.001 && (
                      <p className="text-[10px] text-rose-600 font-normal">
                        Saldo: {dinero(fila.compra.saldoPendiente!, simbolo)}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <Link
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                      href={`/compras/${fila.compra.id}`}
                    >
                      Ver Detalle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
