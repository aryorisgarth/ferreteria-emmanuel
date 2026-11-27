import Link from "next/link";
import { CreditCard, Search, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { SubnavCompras } from "@/components/compras/SubnavCompras";
import { dinero, fechaCorta } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Cuentas por Pagar a Proveedores" };

export default async function CuentasPorPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim().toLowerCase();

  const [cuentas, config] = await Promise.all([
    api.cuentasPorPagar(),
    obtenerConfiguracion(),
  ]);

  const simbolo = config.moneda.simbolo;

  const filasFiltradas = q
    ? cuentas.filter(
        (c) =>
          c.compra.numero.toLowerCase().includes(q) ||
          c.compra.proveedor.toLowerCase().includes(q) ||
          (c.compra.facturaProveedor && c.compra.facturaProveedor.toLowerCase().includes(q)),
      )
    : cuentas;

  const totalAdeudado = filasFiltradas.reduce((acc, c) => acc + c.saldoPendiente, 0);
  const totalFacturasCredito = filasFiltradas.length;

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo="Cuentas por Pagar a Proveedores"
      volverUrl="/compras"
      acciones={
        <div className="flex items-center gap-2">
          <Link className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href="/compras/nueva">
            + Registrar Compra
          </Link>
        </div>
      }
    >
      <SubnavCompras />
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* Tarjetas KPI */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Saldo Adeudado</p>
              <p className="font-mono text-2xl font-black text-rose-700">{dinero(totalAdeudado, simbolo)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Facturas Pendientes</p>
              <p className="font-mono text-2xl font-black text-amber-800">{totalFacturasCredito}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <form
        method="GET"
        className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Buscar por distribuidora o factura..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-brand-yellow focus:bg-white"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Mostrando <strong className="text-slate-800">{filasFiltradas.length}</strong> compras a crédito pendientes
        </span>
      </form>

      {/* Tabla de Cuentas por Pagar */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tabla w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Folio / Factura</th>
                <th className="py-3.5 px-4">Distribuidor / Proveedor</th>
                <th className="py-3.5 px-4">Fecha Emisión</th>
                <th className="py-3.5 px-4">Vencimiento</th>
                <th className="py-3.5 px-4 text-right">Total Factura ({simbolo})</th>
                <th className="py-3.5 px-4 text-right">Abonado ({simbolo})</th>
                <th className="py-3.5 px-4 text-right font-bold text-rose-700">Saldo Pendiente ({simbolo})</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <CreditCard size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No hay cuentas por pagar pendientes en este momento.</p>
                  </td>
                </tr>
              ) : (
                filasFiltradas.map((c) => (
                  <tr key={c.compra.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-slate-900">
                      <Link className="hover:text-amber-600 transition" href={`/compras/${c.compra.id}`}>
                        {c.compra.numero}
                      </Link>
                      {c.compra.facturaProveedor && (
                        <p className="text-[10px] text-slate-400 font-normal">Fact: {c.compra.facturaProveedor}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs sm:text-sm">
                      {c.compra.proveedor}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {fechaCorta(c.compra.fecha)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {c.fechaVencimiento ? fechaCorta(c.fechaVencimiento) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                      {dinero(c.total, simbolo)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                      {dinero(c.totalAbonado, simbolo)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                      {dinero(c.saldoPendiente, simbolo)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        c.estadoPago === "PAGADO"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.estadoPago === "PARCIAL"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {c.estadoPago}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Link
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                        href={`/compras/${c.compra.id}`}
                      >
                        Gestionar / Abonar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageDocument>
  );
}
