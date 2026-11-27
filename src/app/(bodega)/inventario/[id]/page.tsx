import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  DollarSign,
  Package,
  Layers,
  Trash2,
} from "lucide-react";
import { borrarArticuloAction } from "@/app/actions";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { FormularioArticulo } from "@/components/forms/Articulo";
import { dinero, etiquetaUnidad, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Ficha de Artículo" };

export default async function ArticuloPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [articulo, categorias] = await Promise.all([
    api.producto(id),
    api.categorias().catch(() => [
      "Ferretería General",
      "Herramientas",
      "Fontanería",
      "Material Eléctrico",
      "Pinturas y Adhesivos",
      "Construcción",
      "Tornillería y Fijaciones",
    ]),
  ]);

  if (!articulo) notFound();

  const esCritico = articulo.stockActual <= articulo.stockMinimo;
  const esAgotado = articulo.stockActual <= 0;
  const valorEnBodega = articulo.stockActual * (articulo.costo || articulo.precio * 0.7);

  return (
    <PageDocument
      seccion={`Inventario · ${articulo.codigo}`}
      titulo={articulo.nombre}
      folio={articulo.codigo}
      volverUrl="/inventario"
      acciones={
        <div className="flex items-center gap-2">
          <Link
            className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs"
            href={`/kardex?producto=${articulo.id}`}
          >
            <BookOpen size={16} />
            Ver Kárdex
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* Badges de Categoría y Marca */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Categoría: <strong className="ml-1 text-slate-900">{articulo.categoria}</strong>
        </span>
        <span className="inline-flex items-center rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-600/20">
          Marca: <strong className="ml-1">{articulo.marca || "Genérica"}</strong>
        </span>
      </div>

      {/* 1. Métricas Rápidas del Artículo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 font-bold">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Actual</p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {numero(articulo.stockActual)} {etiquetaUnidad(articulo.unidadMedida)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold ${
              esAgotado
                ? "bg-rose-500/10 text-rose-600"
                : esCritico
                ? "bg-amber-500/10 text-amber-600"
                : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado de Stock</p>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold ${
                esAgotado
                  ? "text-rose-700"
                  : esCritico
                  ? "text-amber-800"
                  : "text-emerald-700"
              }`}
            >
              {esAgotado ? "Agotado en Bodega" : esCritico ? "Stock Crítico (Mín. " + articulo.stockMinimo + ")" : "Existencia Óptima"}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Precio de Venta</p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {dinero(articulo.precio)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Valor en Existencia</p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {dinero(valorEnBodega)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Formulario de Edición */}
      <FormularioArticulo categorias={categorias} articulo={articulo} error={sp.error} />

      {/* 3. Zona de Peligro / Borrado */}
      <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-900">Eliminar este artículo del catálogo</h4>
          <p className="text-xs text-rose-700">
            Esta acción solo procede si el artículo no cuenta con movimientos activos o facturas vinculadas en el sistema.
          </p>
        </div>
        <form action={borrarArticuloAction}>
          <input type="hidden" name="id" value={articulo.id} />
          <button
            type="submit"
            className="btn btn-rojo h-9 px-4 text-xs font-bold gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Trash2 size={15} />
            Eliminar Artículo
          </button>
        </form>
      </div>
    </PageDocument>
  );
}
