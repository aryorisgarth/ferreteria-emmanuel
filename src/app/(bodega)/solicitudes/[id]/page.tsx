import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck2,
  PackageCheck,
  Printer,
  Truck,
} from "lucide-react";
import { aprobarAction, entregarAction } from "@/app/actions";
import { SolicitudPapel } from "@/components/documentos/Papeleria";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Detalle de Solicitud de Materiales" };

export default async function SolicitudPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const solicitud = await api.solicitud(id);
  if (!solicitud) notFound();

  const esPendiente = solicitud.estado === "PENDIENTE_DE_REVISION";
  const esAprobado = solicitud.estado === "APROBADO";
  const esEntregado = solicitud.estado === "ENTREGADO";

  return (
    <PageDocument
      seccion="Expedientes de Bodega"
      titulo={`Solicitud ${solicitud.numero}`}
      folio="SM"
      acciones={
        <div className="flex items-center gap-2">
          <Link className="btn btn-azul h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href={`/solicitudes/${id}/imprimir`}>
            <Printer size={15} />
            Imprimir Solicitud
          </Link>
          {solicitud.actaId && (
            <Link className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href={`/actas/${solicitud.actaId}`}>
              <FileCheck2 size={15} />
              Ver Acta {solicitud.actaNumero}
            </Link>
          )}
          <Link className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5 no-print" href="/solicitudes">
            <ArrowLeft size={15} />
            Volver
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* Stepper del Flujo de Bodega */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Etapa del Flujo Operativo:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Paso 1: Registro */}
          <div
            className={`rounded-xl border p-3 flex items-center gap-3 ${
              esPendiente
                ? "border-amber-400 bg-amber-50/70 text-amber-900"
                : "border-emerald-200 bg-emerald-50/40 text-emerald-800"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                esPendiente ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-900"
              }`}
            >
              1
            </div>
            <div>
              <p className="text-xs font-bold">Solicitud Registrada</p>
              <p className="text-[11px] text-slate-500">Pendiente de revisión</p>
            </div>
          </div>

          {/* Paso 2: Aprobación */}
          <div
            className={`rounded-xl border p-3 flex items-center gap-3 ${
              esAprobado
                ? "border-amber-400 bg-amber-50/70 text-amber-900"
                : esEntregado
                ? "border-emerald-200 bg-emerald-50/40 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                esAprobado
                  ? "bg-amber-200 text-amber-900"
                  : esEntregado
                  ? "bg-emerald-200 text-emerald-900"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </div>
            <div>
              <p className="text-xs font-bold">Aprobada y Acta Emitida</p>
              <p className="text-[11px] text-slate-500">
                {solicitud.actaNumero ? `Acta ${solicitud.actaNumero}` : "Por autorizar"}
              </p>
            </div>
          </div>

          {/* Paso 3: Entrega y Descargo */}
          <div
            className={`rounded-xl border p-3 flex items-center gap-3 ${
              esEntregado
                ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                esEntregado ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              3
            </div>
            <div>
              <p className="text-xs font-bold">Materiales Entregados</p>
              <p className="text-[11px] text-slate-500">
                {esEntregado ? "Kárdex descargado" : "Pendiente de despacho"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Acciones del Bodeguero */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {esPendiente && (
            <form action={aprobarAction}>
              <input type="hidden" name="id" value={solicitud.id} />
              <button className="btn btn-azul h-10 px-5 text-xs font-bold gap-1.5 shadow-xs">
                <CheckCircle2 size={15} />
                Aprobar Solicitud y Emitir Acta
              </button>
            </form>
          )}

          {esAprobado && (
            <form action={entregarAction}>
              <input type="hidden" name="id" value={solicitud.id} />
              <button className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-amber-500/20">
                <PackageCheck size={16} />
                Confirmar Entrega Física y Descargar Kárdex
              </button>
            </form>
          )}

          {esEntregado && (
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
              <CheckCircle2 size={16} />
              Despacho completado con éxito. El inventario ha sido descontado.
            </div>
          )}
        </div>

        {solicitud.actaId && (
          <Link
            href={`/actas/${solicitud.actaId}/imprimir`}
            className="btn btn-linea h-10 px-4 text-xs font-bold gap-1.5"
          >
            <Printer size={14} />
            Imprimir Acta Oficial
          </Link>
        )}
      </div>

      {/* Documento en Papelería Oficial */}
      <SolicitudPapel solicitud={solicitud} />
    </PageDocument>
  );
}
