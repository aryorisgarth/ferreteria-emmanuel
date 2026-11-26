import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  Plus,
  Search,
  Truck,
} from "lucide-react";
import { PageDocument, Paginacion, Sello } from "@/components/documentos/Pieza";
import { fechaCorta } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import type { EstadoSolicitud } from "@/lib/types";

export const metadata = { title: "Solicitudes de Materiales" };

export default async function Solicitudes({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; estado?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page || 1);
  const estadoFiltro = sp.estado ? (sp.estado as EstadoSolicitud) : undefined;
  const q = (sp.q || "").trim().toLowerCase();

  const hoja = await api.solicitudes(page, estadoFiltro);

  const filasFiltradas = q
    ? hoja.rows.filter(
        (f) =>
          f.numero.toLowerCase().includes(q) ||
          f.solicitante.toLowerCase().includes(q) ||
          f.destinatario.toLowerCase().includes(q) ||
          f.oficinaNombre.toLowerCase().includes(q),
      )
    : hoja.rows;

  return (
    <PageDocument
      seccion="Expedientes de Pedido"
      titulo="Solicitudes de Materiales"
      folio="SM"
      acciones={
        <div className="flex items-center gap-2">
          <Link
            className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs"
            href="/solicitudes/nueva"
          >
            <Plus size={15} />
            Nueva Solicitud
          </Link>
          <Link
            className="btn btn-linea h-10 px-4 text-xs font-bold gap-1.5"
            href="/bodega"
          >
            <Truck size={15} />
            Centro de Bodega
          </Link>
        </div>
      }
    >
      {/* Barra de Filtros y Búsqueda */}
      <form
        method="GET"
        className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              name="q"
              defaultValue={sp.q || ""}
              placeholder="Buscar por solicitante, dependencia o folio (SM-...)..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-brand-yellow focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={15} className="text-slate-400 ml-1" />
            <select
              name="estado"
              defaultValue={sp.estado || ""}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-yellow focus:bg-white"
            >
              <option value="">Todos los Estados</option>
              <option value="PENDIENTE_DE_REVISION">Pendiente de Revisión</option>
              <option value="APROBADO">Aprobado (Listo para Entrega)</option>
              <option value="ENTREGADO">Entregado (Descargado de Kárdex)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-azul h-10 px-4 text-xs font-bold shadow-xs">
            Filtrar
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Mostrando <strong className="text-slate-800">{filasFiltradas.length}</strong> de{" "}
          <strong className="text-slate-800">{hoja.total}</strong> solicitudes
        </span>
      </form>

      {/* Tabla Responsiva */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tabla w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Folio / Número</th>
                <th className="py-3.5 px-4">Fecha Emisión</th>
                <th className="py-3.5 px-4">Solicitante</th>
                <th className="py-3.5 px-4">Dependencia / Obra</th>
                <th className="py-3.5 px-4 text-center">Estado del Pedido</th>
                <th className="py-3.5 px-4">Acta Oficial</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <FileText size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No se encontraron solicitudes con esos criterios.</p>
                  </td>
                </tr>
              ) : (
                filasFiltradas.map((fila) => (
                  <tr key={fila.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-slate-900">
                      <Link className="hover:text-amber-600 transition" href={`/solicitudes/${fila.id}`}>
                        {fila.numero}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {fechaCorta(fila.fecha)}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900 text-xs sm:text-sm">
                      {fila.solicitante}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <p className="font-medium text-slate-800">{fila.destinatario}</p>
                      <span className="text-[11px] text-slate-400">{fila.oficinaNombre}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Sello estado={fila.estado} />
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono">
                      {fila.actaNumero ? (
                        <span className="font-bold text-slate-800">{fila.actaNumero}</span>
                      ) : (
                        <span className="text-slate-400">Pendiente emisión</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Link
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-1"
                        href={`/solicitudes/${fila.id}`}
                      >
                        Abrir
                        <ExternalLink size={11} className="opacity-40" />
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
        <Paginacion
          page={hoja.page}
          pages={hoja.pages}
          total={hoja.total}
          ruta="/solicitudes"
          params={{ estado: sp.estado, q: sp.q }}
        />
      </div>
    </PageDocument>
  );
}
