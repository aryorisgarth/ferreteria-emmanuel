import Link from "next/link";
import { FileCheck2, Search, Truck } from "lucide-react";
import { PageDocument, Paginacion } from "@/components/documentos/Pieza";
import { TablaActas } from "@/components/actas/TablaActas";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Actas de Entrega Oficiales" };

export default async function Actas({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page || 1);
  const q = (sp.q || "").trim().toLowerCase();

  const hoja = await api.actas(page);

  const filasFiltradas = q
    ? hoja.rows.filter(
        (f) =>
          f.numero.toLowerCase().includes(q) ||
          f.destinatario.toLowerCase().includes(q) ||
          f.oficinaNombre.toLowerCase().includes(q) ||
          (f.solicitudNumero && f.solicitudNumero.toLowerCase().includes(q)),
      )
    : hoja.rows;

  return (
    <PageDocument
      seccion="Documentos de Salida"
      titulo="Actas de Entrega Oficiales"
      folio="AE"
      acciones={
        <div className="flex items-center gap-2">
          <Link
            className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs"
            href="/solicitudes"
          >
            <FileCheck2 size={15} />
            Ver Solicitudes
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
            placeholder="Buscar por folio (AE-...), destinatario o dependencia..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-brand-yellow focus:bg-white"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Mostrando <strong className="text-slate-800">{filasFiltradas.length}</strong> actas de entrega
        </span>
      </form>

      <TablaActas filas={filasFiltradas} />

      <div className="mt-4">
        <Paginacion page={hoja.page} pages={hoja.pages} total={hoja.total} ruta="/actas" params={{ q }} />
      </div>
    </PageDocument>
  );
}
