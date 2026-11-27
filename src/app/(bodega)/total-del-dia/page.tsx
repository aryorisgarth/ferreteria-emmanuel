import Link from "next/link";
import {
  Calendar,
  Filter,
  Package,
  Printer,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageDocument, Paginacion } from "@/components/documentos/Pieza";
import { etiquetaUnidad, fechaLarga, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Arqueo y Total del Día" };

export default async function TotalDelDia({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const fechaActual = await api.fecha();
  const fecha = sp.fecha || fechaActual;
  const hoja = await api.total(fecha, Number(sp.page || 1));

  // KPIs del día
  const filas = hoja?.rows || [];
  const totalRenglones = hoja?.total || 0;
  const totalUnidades = filas.reduce((sum, r) => sum + (r.total || 0), 0);
  const destinatariosSet = new Set<string>();
  filas.forEach((r) => r.destinatarios?.forEach((d) => d && destinatariosSet.add(d)));
  const totalClientes = destinatariosSet.size;

  return (
    <PageDocument
      seccion="Control Diario & Auditoría"
      titulo="Consolidado de Despachos del Día"
      folio={fecha}
      ancho="pliego"
      volverUrl="/inicio"
      acciones={
        <button
          onClick={undefined}
          className="no-print btn btn-amarillo h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]"
        >
          <Printer size={15} />
          Imprimir Consolidado
        </button>
      }
    >
      <p className="mb-4 text-xs text-slate-500">
        Resumen general de salidas, despachos y entregas de mercadería del{" "}
        <strong className="text-slate-700">{fechaLarga(fecha)}</strong>.
      </p>

      {/* 1. Métricas del Día */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-blue-500/10 text-blue-600 font-bold">
            <Package size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Artículos Despachados
            </p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight">
              {totalRenglones} distintos
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-emerald-500/10 text-emerald-600 font-bold">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Volumen Total Saliente
            </p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight">
              {numero(totalUnidades)} unidades
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-amber-500/10 text-amber-600 font-bold">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Destinatarios / Clientes
            </p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight">
              {totalClientes} atendidos
            </p>
          </div>
        </div>
      </div>

      {/* 2. Selector de Fecha y Filtros */}
      <form
        className="no-print mb-5 flex flex-wrap items-end justify-between gap-3 bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs"
        action="/total-del-dia"
      >
        <div className="flex items-end gap-2.5 flex-wrap">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Fecha de Consulta
            </span>
            <div className="relative">
              <Calendar
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                className="h-9 rounded-[5px] border border-slate-300 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white font-mono"
                type="date"
                name="fecha"
                defaultValue={fecha}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-amarillo h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]"
          >
            <Filter size={14} />
            Consultar Fecha
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/total-del-dia?fecha=${fechaActual}`}
            className={`px-3 py-1.5 text-xs font-bold rounded-[5px] border transition ${fecha === fechaActual
              ? "border-amber-400 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
          >
            Hoy
          </Link>
          <Link
            href="/caja"
            className="px-3 py-1.5 text-xs font-bold rounded-[5px] border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
          >
            Ver Turnos de Caja
          </Link>
        </div>
      </form>

      {/* 3. Tabla Completa con Scroll Horizontal */}
      <div className="bg-white rounded-[6px] border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Código</th>
                <th className="py-3.5 px-4">Descripción del Artículo</th>
                <th className="py-3.5 px-4">Unidad</th>
                <th className="py-3.5 px-4 text-right">Total Despachado</th>
                <th className="py-3.5 px-4 sm:px-6">Destinatarios / Clientes Atendidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                    No se registraron despachos ni salidas en esta fecha.
                  </td>
                </tr>
              ) : (
                filas.map((fila) => (
                  <tr
                    key={`${fila.productoId}-${fila.unidadMedida}`}
                    className="hover:bg-slate-50/70 transition"
                  >
                    <td className="py-3 px-4 sm:px-6 font-mono text-xs font-bold text-slate-600">
                      <Link
                        className="hover:text-amber-600 transition"
                        href={`/kardex?producto=${fila.productoId}`}
                      >
                        {fila.codigo}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{fila.nombre}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {etiquetaUnidad(fila.unidadMedida)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {numero(fila.total)}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-xs text-slate-500">
                      <div className="flex flex-wrap gap-1">
                        {fila.destinatarios.map((d, idx) => (
                          <span
                            key={idx}
                            className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {d || "Venta de Mostrador"}
                          </span>
                        ))}
                      </div>
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
          page={hoja?.page || 1}
          pages={hoja?.pages || 1}
          total={hoja?.total || 0}
          ruta="/total-del-dia"
          params={{ fecha }}
        />
      </div>
    </PageDocument>
  );
}
