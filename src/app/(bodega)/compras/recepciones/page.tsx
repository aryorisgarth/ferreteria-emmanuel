import Link from "next/link";
import { Plus, Search, PackageCheck } from "lucide-react";
import { Aviso, PageDocument, Paginacion } from "@/components/documentos/Pieza";
import { SubnavCompras } from "@/components/compras/SubnavCompras";
import { dinero, fechaCorta } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Recepciones de Mercancía" };

export default async function RecepcionesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim().toLowerCase();
  const page = Number(sp.page || 1);

  const [hoja, config] = await Promise.all([
    api.recepciones(page),
    obtenerConfiguracion(),
  ]);

  const filasFiltradas = q
    ? hoja.rows.filter(
        (r) =>
          r.numero.toLowerCase().includes(q) ||
          r.proveedor.toLowerCase().includes(q) ||
          (r.remisionProveedor && r.remisionProveedor.toLowerCase().includes(q)),
      )
    : hoja.rows;

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo="Recepciones Físicas de Mercancía"
      volverUrl="/compras"
      acciones={
        <Link className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href="/compras/recepciones/nueva">
          <Plus size={15} />
          Nueva Recepción
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
            placeholder="Buscar por proveedor, remisión o folio (REC-...)..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-brand-yellow focus:bg-white"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Mostrando <strong className="text-slate-800">{filasFiltradas.length}</strong> recepciones
        </span>
      </form>

      {/* Tabla de Recepciones */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tabla w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Folio Recepción</th>
                <th className="py-3.5 px-4">Proveedor</th>
                <th className="py-3.5 px-4">Fecha Ingreso</th>
                <th className="py-3.5 px-4">No. Remisión</th>
                <th className="py-3.5 px-4">Renglones</th>
                <th className="py-3.5 px-4 text-center">Conformidad</th>
                <th className="py-3.5 px-4 text-center">Factura Registrada</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <PackageCheck size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No se encontraron recepciones de mercancía registradas.</p>
                  </td>
                </tr>
              ) : (
                filasFiltradas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-slate-900">
                      <Link className="hover:text-amber-600 transition" href={`/compras/recepciones/${r.id}`}>
                        {r.numero}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs sm:text-sm">
                      {r.proveedor}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {fechaCorta(r.fecha)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      {r.remisionProveedor || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      {r.items.length} artículos
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        r.estadoConformidad === "CONFORME"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.estadoConformidad === "INCOMPLETO"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {r.estadoConformidad || "CONFORME"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ Stock en Kárdex
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Link
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                        href={`/compras/recepciones/${r.id}`}
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
        <Paginacion page={hoja.page} pages={hoja.pages} total={hoja.total} ruta="/compras/recepciones" />
      </div>
    </PageDocument>
  );
}
