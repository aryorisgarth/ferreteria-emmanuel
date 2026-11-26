import Link from "next/link";
import { AlertTriangle, ArrowRight, Package, Receipt, ShoppingCart, Truck, Users, Wallet } from "lucide-react";
import { etiquetaUnidad, numero } from "@/lib/format";
import type { ProductoVista } from "@/lib/types";

export function SeccionOperativaInicio({ stockBajo }: { stockBajo: ProductoVista[] }) {
  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-2">
      {/* Alertas de Stock Mínimo */}
      <div className="card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <h2 className="font-bold text-slate-900 text-sm">Alertas de Stock por Reponer</h2>
            </div>
            <Link href="/inventario" className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
              Ver inventario <ArrowRight size={12} />
            </Link>
          </div>

          {stockBajo.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Package size={28} className="mx-auto mb-1.5 opacity-30" />
              <p className="text-xs font-semibold">Todas las existencias están por encima del stock mínimo.</p>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {stockBajo.slice(0, 6).map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <Link href={`/inventario/${p.id}`} className="font-bold text-slate-800 hover:underline">
                      {p.nombre}
                    </Link>
                    <p className="text-[11px] text-slate-400 font-mono">{p.codigo} · {p.categoria}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {numero(p.stockActual)} {etiquetaUnidad(p.unidadMedida)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {stockBajo.length > 0 && (
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">{stockBajo.length} artículos en umbral crítico</span>
            <Link href="/compras/pedidos/nuevo?sugerido=1" className="btn btn-navy h-8 px-3 text-xs font-bold gap-1">
              <Truck size={13} />
              Generar Pedido Sugerido
            </Link>
          </div>
        )}
      </div>

      {/* Operaciones Rápidas de Mostrador */}
      <div className="card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-600" />
              <h2 className="font-bold text-slate-900 text-sm">Operaciones Rápidas de Mostrador</h2>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/caja"
              className="flex items-center gap-2.5 p-2.5 rounded border border-slate-200 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-100/70 transition group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white font-bold shrink-0">
                <ShoppingCart size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Punto de Venta</p>
                <p className="text-[10px] text-slate-400">Cobro en caja (F1)</p>
              </div>
            </Link>

            <Link
              href="/cotizaciones/nueva"
              className="flex items-center gap-2.5 p-2.5 rounded border border-slate-200 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-100/70 transition group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-white font-bold shrink-0">
                <Receipt size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Cotización</p>
                <p className="text-[10px] text-slate-400">Presupuesto cliente</p>
              </div>
            </Link>

            <Link
              href="/compras/nueva"
              className="flex items-center gap-2.5 p-2.5 rounded border border-slate-200 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-100/70 transition group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-white font-bold shrink-0">
                <Truck size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Entrada Compra</p>
                <p className="text-[10px] text-slate-400">Ingreso mercadería</p>
              </div>
            </Link>

            <Link
              href="/gastos"
              className="flex items-center gap-2.5 p-2.5 rounded border border-slate-200 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-100/70 transition group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-white font-bold shrink-0">
                <Wallet size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Registrar Gasto</p>
                <p className="text-[10px] text-slate-400">Salida de caja</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Modo Operativo: <span className="text-emerald-700 font-bold">● Local Persistente</span>
          </span>
          <Link href="/total-del-dia" className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition">
            Arqueo de caja →
          </Link>
        </div>
      </div>
    </section>
  );
}
