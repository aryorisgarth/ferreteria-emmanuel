import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Aviso, PageDocument, Paginacion } from "@/components/documentos/Pieza";
import { SubnavCompras } from "@/components/compras/SubnavCompras";
import { TablaCompras } from "@/components/compras/TablaCompras";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Compras y Reabastecimiento" };

export default async function Compras({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim().toLowerCase();
  const page = Number(sp.page || 1);

  const [hoja, config] = await Promise.all([api.compras(page), obtenerConfiguracion()]);
  const simbolo = config.moneda.simbolo;

  const filasFiltradas = q
    ? hoja.rows.filter(
        (f) => f.compra.numero.toLowerCase().includes(q) || f.compra.proveedor.toLowerCase().includes(q)
      )
    : hoja.rows;

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo="Compras a Proveedores"
      anchoCompleto={true}
      acciones={
        <Link className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href="/compras/nueva">
          <Plus size={15} />
          Nueva Compra
        </Link>
      }
    >
      <SubnavCompras />
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      <form method="GET" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Buscar por distribuidora o folio (COM-...)..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-brand-yellow focus:bg-white"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Mostrando <strong className="text-slate-800">{filasFiltradas.length}</strong> compras
        </span>
      </form>

      <TablaCompras filas={filasFiltradas} simbolo={simbolo} />

      <div className="mt-4">
        <Paginacion page={hoja.page} pages={hoja.pages} total={hoja.total} ruta="/compras" />
      </div>
    </PageDocument>
  );
}
