import Link from "next/link";
import { Plus, Search, Undo2 } from "lucide-react";
import { Aviso, PageDocument, Paginacion } from "@/components/documentos/Pieza";
import { SubnavCompras } from "@/components/compras/SubnavCompras";
import { dinero, fechaCorta } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Devoluciones a Proveedores" };

export default async function DevolucionesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim().toLowerCase();
  const page = Number(sp.page || 1);

  const [hoja, config] = await Promise.all([
    api.devoluciones(page),
    obtenerConfiguracion(),
  ]);

  const simbolo = config.moneda.simbolo;

  const filasFiltradas = q
    ? hoja.rows.filter(
        (d) =>
          d.numero.toLowerCase().includes(q) ||
          d.proveedor.toLowerCase().includes(q) ||
          d.motivo.toLowerCase().includes(q),
      )
    : hoja.rows;

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo="Devoluciones a Proveedores"
      acciones={
        <Link className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href="/compras/devoluciones/nueva">
          <Plus size={15} />
          Nueva Devolución
        </Link>
      }
    >
      <SubnavCompras />
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* Barra de Búsqueda */}
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
            placeholder="Buscar por distribuidora, motivo o folio (DEV-...)..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-brand-yellow focus:bg-white"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Mostrando <strong className="text-slate-800">{filasFiltradas.length}</strong> devoluciones
        </span>
      </form>

      {/* Tabla de Devoluciones */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tabla w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Folio Devolución</th>
                <th className="py-3.5 px-4">Distribuidor / Proveedor</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Motivo</th>
                <th className="py-3.5 px-4">Renglones</th>
                <th className="py-3.5 px-4 text-center">Salida en Kárdex</th>
                <th className="py-3.5 px-4 text-right">Total Devuelto ({simbolo})</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Undo2 size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No se han registrado devoluciones de mercadería a proveedores.</p>
                  </td>
                </tr>
              ) : (
                filasFiltradas.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-slate-900">
                      <Link className="hover:text-amber-600 transition" href={`/compras/devoluciones/${d.id}`}>
                        {d.numero}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs sm:text-sm">
                      {d.proveedor}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {fechaCorta(d.fecha)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {d.motivo}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      {d.items.length} artículos
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Descargado de Bodega
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                      {dinero(d.total, simbolo)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Link
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                        href={`/compras/devoluciones/${d.id}`}
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

      <div className="mt-4">
        <Paginacion page={hoja.page} pages={hoja.pages} total={hoja.total} ruta="/compras/devoluciones" />
      </div>
    </PageDocument>
  );
}
