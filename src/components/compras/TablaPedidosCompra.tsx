import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { fechaCorta } from "@/lib/format";
import type { PedidoCompra } from "@/lib/types";

export function TablaPedidosCompra({ pedidos }: { pedidos: PedidoCompra[] }) {
  if (pedidos.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-xs">
        <ClipboardList size={36} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">No se encontraron pedidos de compra registrados.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="tabla w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Folio Pedido</th>
              <th className="py-3.5 px-4">Distribuidor / Proveedor</th>
              <th className="py-3.5 px-4">Fecha Emisión</th>
              <th className="py-3.5 px-4">Entrega Esperada</th>
              <th className="py-3.5 px-4">Renglones</th>
              <th className="py-3.5 px-4 text-center">Estado del Pedido</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-slate-900">
                  <Link className="hover:text-amber-600 transition" href={`/compras/pedidos/${pedido.id}`}>
                    {pedido.numero}
                  </Link>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs sm:text-sm">
                  {pedido.proveedor}
                </td>
                <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                  {fechaCorta(pedido.fechaEmision)}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                  {pedido.fechaEntregaEstimada ? fechaCorta(pedido.fechaEntregaEstimada) : "Inmediata"}
                </td>
                <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                  {pedido.items.length} artículos
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      pedido.estado === "RECIBIDO"
                        ? "bg-emerald-100 text-emerald-800"
                        : pedido.estado === "PARCIAL"
                        ? "bg-blue-100 text-blue-800"
                        : pedido.estado === "EMITIDO"
                        ? "bg-amber-100 text-amber-800"
                        : pedido.estado === "CANCELADO"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {pedido.estado}
                  </span>
                </td>
                <td className="py-3.5 px-4 sm:px-6 text-right">
                  <Link
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                    href={`/compras/pedidos/${pedido.id}`}
                  >
                    Ver Detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
