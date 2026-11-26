import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { TablaKardex } from "@/components/documentos/TablaKardex";
import { etiquetaTipo, etiquetaUnidad, fechaCorta, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Consulta de Renglón de Kárdex" };

export default async function DetalleMovimientoKardex({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const mov = await api.movimiento(id);
  if (!mov) notFound();

  const [producto, hoja] = await Promise.all([
    api.producto(mov.productoId),
    api.kardex({ productoId: mov.productoId, page: "ultima" }),
  ]);

  return (
    <PageDocument
      seccion="Auditoría e Inmutabilidad de Kárdex"
      titulo={`${mov.codigo} · ${mov.nombre}`}
      folio={mov.numeroReferencia || "KDX"}
      acciones={
        <Link className="btn btn-linea h-10 px-4 text-xs font-bold gap-1.5" href={`/kardex?producto=${mov.productoId}`}>
          <ArrowLeft size={15} />
          Volver al Kárdex
        </Link>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}

      {/* Banner de Inmutabilidad Contable */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-amber-950">Historial Inmutable de Auditoría</h3>
            <p className="leading-relaxed">
              Por normativa fiscal, trazabilidad contable y auditoría de inventario, los renglones registrados en el Kárdex no admiten modificación directa de cantidades, fechas, referencias ni costos.
            </p>
            <p className="font-semibold text-amber-900">
              Cualquier discrepancia física detectada en bodega debe registrarse mediante un{" "}
              <Link href="/inventario/ajustes/nuevo" className="underline font-bold text-amber-950 hover:text-black">
                Ajuste Formal de Inventario
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Ficha de Información del Renglón (Solo Lectura) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs mb-8 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          Detalle del Movimiento Registrado
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Fecha</span>
            <span className="font-mono font-bold text-slate-800">{fechaCorta(mov.fecha)}</span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Hora de Registro</span>
            <span className="font-mono text-slate-700">{mov.createdAt ? mov.createdAt.slice(11, 19) : "—"}</span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Folio / Referencia</span>
            <span className="font-mono font-bold text-slate-900">{mov.numeroReferencia || "—"}</span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Origen</span>
            <span className="font-bold text-slate-800">{mov.origen}</span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Tipo de Movimiento</span>
            <span className="font-bold text-slate-800">{etiquetaTipo(mov.tipo)}</span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Cantidad Asentada</span>
            <span className="font-mono font-extrabold text-sm text-slate-900">
              {numero(mov.cantidad)} {producto ? etiquetaUnidad(producto.unidadMedida) : ""}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Saldo Resultante</span>
            <span className="font-mono font-extrabold text-sm text-slate-900">
              {numero(mov.stockSaldo)} {producto ? etiquetaUnidad(producto.unidadMedida) : ""}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase">Responsable</span>
            <span className="font-medium text-slate-800">{mov.usuario}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 text-xs space-y-1">
          <div>
            <span className="text-slate-400 font-semibold mr-2">Concepto:</span>
            <span className="text-slate-800 font-medium">{mov.concepto}</span>
          </div>
          {mov.destinatario && (
            <div>
              <span className="text-slate-400 font-semibold mr-2">Destinatario / Entidad:</span>
              <span className="text-slate-800 font-medium">{mov.destinatario}</span>
            </div>
          )}
        </div>

        <div className="pt-2 flex gap-3">
          <Link href={`/kardex?producto=${mov.productoId}`} className="btn btn-linea h-9 px-4 text-xs font-bold">
            Cerrar Consulta
          </Link>
          <Link href="/inventario/ajustes/nuevo" className="btn btn-navy h-9 px-4 text-xs font-bold gap-1.5">
            <SlidersHorizontal size={14} />
            Crear Ajuste para este Artículo
          </Link>
        </div>
      </div>

      <h2 className="mb-3 font-display text-xl font-bold text-slate-900">
        Secuencia Histórica del Artículo
      </h2>
      <TablaKardex filas={hoja.rows} />
    </PageDocument>
  );
}
