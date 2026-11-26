import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, PackageCheck, Printer } from "lucide-react";
import { entregarAction } from "@/app/actions";
import { BotonImprimir } from "@/components/documentos/Imprimir";
import { DocumentoActaEntrega } from "@/components/actas/DocumentoActaEntrega";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Detalle de Acta de Entrega" };

export default async function ActaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const acta = await api.acta(id);
  if (!acta) notFound();

  return (
    <PageDocument
      seccion="Documentos Oficiales de Bodega"
      titulo={`Acta de Entrega ${acta.numero}`}
      folio="AE"
      anchoCompleto={true}
      acciones={
        <div className="flex items-center gap-2">
          <BotonImprimir>
            <Printer size={15} />
            Imprimir Acta Oficial
          </BotonImprimir>
          <Link className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5 no-print" href="/actas">
            <ArrowLeft size={15} />
            Volver a Actas
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* Barra de Acciones del Bodeguero */}
      {acta.solicitudId && !acta.ejecutada && (
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4 shadow-xs">
          <div>
            <p className="text-xs font-bold text-amber-950">Acta emitida sin descargo de kárdex</p>
            <p className="text-[11px] text-amber-800">
              Presione el botón cuando los materiales salgan físicamente de la bodega para actualizar el inventario.
            </p>
          </div>
          <form action={entregarAction}>
            <input type="hidden" name="id" value={acta.solicitudId} />
            <input type="hidden" name="volver" value={`/actas/${acta.id}`} />
            <button className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-amber-500/20">
              <PackageCheck size={16} />
              Confirmar Entrega y Descargar Kárdex
            </button>
          </form>
        </div>
      )}

      {acta.ejecutada && (
        <div className="no-print mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Descargo ejecutado en el kárdex general. Los materiales ya salieron del almacén.
        </div>
      )}

      <DocumentoActaEntrega acta={acta} />
    </PageDocument>
  );
}
