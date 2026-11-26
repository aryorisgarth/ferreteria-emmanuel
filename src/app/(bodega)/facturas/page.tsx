import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Filter,
  Plus,
  Printer,
  Receipt,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { Aviso, PageDocument, Paginacion } from "@/components/documentos/Pieza";
import { dinero, etiquetaFactura, etiquetaPago, fechaCorta } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Facturación Electrónica" };

const ESTADOS_FACTURA: Record<
  string,
  { label: string; badge: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  EMITIDA: {
    label: "Por Cobrar",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
  },
  PAGADA: {
    label: "Pagada",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  ANULADA: {
    label: "Anulada",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

export default async function Facturas({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; estado?: string; aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const estado = sp.estado || "";
  const page = Number(sp.page || 1);

  const [hoja, config] = await Promise.all([
    api.facturas(page, q, estado),
    obtenerConfiguracion(),
  ]);

  const simbolo = config.moneda.simbolo;

  return (
    <PageDocument
      seccion="Ventas"
      titulo="Facturación y Ventas"
      acciones={
        <div className="flex items-center gap-2">
          <Link className="btn btn-linea h-9 px-3.5 text-xs font-bold gap-1.5 rounded-[5px]" href="/cobranza">
            <Receipt size={15} />
            Cobranza & Transferencias
          </Link>
          <Link className="btn btn-amarillo h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]" href="/facturas/nueva">
            <Plus size={15} />
            Nueva Factura Directa
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* Barra de Búsqueda y Filtros */}
      <form
        method="GET"
        className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-slate-200 bg-white p-3.5 shadow-2xs"
      >
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por cliente o folio (FAC-...)..."
              className="h-9 w-full rounded-[5px] border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400 ml-1" />
            <select
              name="estado"
              defaultValue={estado}
              className="h-9 rounded-[5px] border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="">Todos los Estados</option>
              <option value="PAGADA">Pagada</option>
              <option value="EMITIDA">Por Cobrar (Crédito)</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>

          <button type="submit" className="btn btn-linea h-9 px-3.5 text-xs font-bold shadow-2xs rounded-[5px]">
            Filtrar
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Mostrando <strong className="text-slate-800">{hoja.rows.length}</strong> de{" "}
          <strong className="text-slate-800">{hoja.total}</strong> facturas
        </span>
      </form>

      {/* Listado Dual: Tarjetas para Móvil/Tablet y Tabla para Escritorio */}
      <div className="rounded-[6px] border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Vista Móvil / Tablet Vertical (lg:hidden) */}
        <div className="lg:hidden divide-y divide-slate-100">
          {hoja.total === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Receipt size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No se encontraron facturas con ese criterio.</p>
            </div>
          ) : (
            hoja.rows.map((fila) => {
              const est = ESTADOS_FACTURA[fila.factura.estado] || ESTADOS_FACTURA.EMITIDA;
              const IconoEstado = est.icon;

              return (
                <div key={fila.factura.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/facturas/${fila.factura.id}`}
                          className="font-mono text-xs font-bold text-slate-900 hover:text-amber-600 transition"
                        >
                          {fila.factura.numero}
                        </Link>
                        <span className="text-[11px] font-medium text-slate-500 font-mono">
                          {fechaCorta(fila.factura.fecha)}
                        </span>
                        <span className="rounded-[4px] bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {etiquetaPago(fila.factura.formaPago)}
                        </span>
                      </div>
                      <p className="mt-1 font-bold text-sm text-slate-900">{fila.factura.cliente}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold shrink-0 ${est.badge}`}
                    >
                      <IconoEstado size={12} />
                      {est.label}
                    </span>
                  </div>

                  {fila.factura.notas && (
                    <p className="text-xs text-slate-500 truncate">{fila.factura.notas}</p>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Facturado</span>
                      <span className="font-mono font-extrabold text-sm text-slate-900">
                        {dinero(fila.total, simbolo)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        className="rounded-[4px] border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
                        href={`/facturas/${fila.factura.id}`}
                        title="Imprimir Factura"
                      >
                        <Printer size={14} />
                      </Link>
                      <Link
                        className="rounded-[4px] border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                        href={`/facturas/${fila.factura.id}`}
                      >
                        Ver Factura
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Vista Tabla para Escritorio (hidden lg:block) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="tabla w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 sm:px-6">Folio / Factura</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4">Forma Pago</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Total ({simbolo})</th>
                <th className="py-3 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hoja.total === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Receipt size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No se encontraron facturas con ese criterio.</p>
                  </td>
                </tr>
              ) : (
                hoja.rows.map((fila) => {
                  const est = ESTADOS_FACTURA[fila.factura.estado] || ESTADOS_FACTURA.EMITIDA;
                  const IconoEstado = est.icon;

                  return (
                    <tr key={fila.factura.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 sm:px-6">
                        <Link
                          className="font-mono text-xs font-bold text-slate-900 hover:text-amber-600 transition"
                          href={`/facturas/${fila.factura.id}`}
                        >
                          {fila.factura.numero}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 text-xs sm:text-sm">{fila.factura.cliente}</p>
                        {fila.factura.notas && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">{fila.factura.notas}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">
                        {fechaCorta(fila.factura.fecha)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <span className="font-medium">{etiquetaPago(fila.factura.formaPago)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold ${est.badge}`}
                        >
                          <IconoEstado size={12} />
                          {est.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {dinero(fila.total, simbolo)}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            className="rounded-[4px] border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
                            href={`/facturas/${fila.factura.id}`}
                            title="Imprimir Factura"
                          >
                            <Printer size={14} />
                          </Link>
                          <Link
                            className="rounded-[4px] border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                            href={`/facturas/${fila.factura.id}`}
                          >
                            Ver Factura
                          </Link>
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

      <div className="mt-4">
        <Paginacion
          page={hoja.page}
          pages={hoja.pages}
          total={hoja.total}
          ruta="/facturas"
          params={{ q, estado }}
        />
      </div>
    </PageDocument>
  );
}
