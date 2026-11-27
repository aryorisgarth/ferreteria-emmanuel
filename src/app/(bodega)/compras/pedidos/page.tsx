import Link from "next/link";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { Aviso, PageDocument, Paginacion } from "@/components/documentos/Pieza";
import { SubnavCompras } from "@/components/compras/SubnavCompras";
import { TablaPedidosCompra } from "@/components/compras/TablaPedidosCompra";
import * as api from "@/lib/inventory/api";
import type { EstadoPedidoCompra } from "@/lib/types";

export const metadata = { title: "Pedidos y Órdenes de Compra" };

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; estado?: string; aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim().toLowerCase();
  const estadoFiltro = sp.estado as EstadoPedidoCompra | undefined;
  const page = Number(sp.page || 1);

  const [hoja, catalogo] = await Promise.all([
    api.pedidos(page, estadoFiltro ? { estado: estadoFiltro } : undefined),
    api.catalogo().catch(() => []),
  ]);

  const faltantes = catalogo.filter((p) => p.stockActual <= p.stockMinimo).length;

  const filasFiltradas = q
    ? hoja.rows.filter(
        (p) =>
          p.numero.toLowerCase().includes(q) ||
          p.proveedor.toLowerCase().includes(q),
      )
    : hoja.rows;

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo="Pedidos y Órdenes de Compra"
      volverUrl="/compras"
      acciones={
        <div className="flex items-center gap-2">
          {faltantes > 0 && (
            <Link
              className="bg-amber-600 hover:bg-amber-700 text-white h-10 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
              href="/compras/pedidos/nuevo?sugerido=1"
              title={`${faltantes} artículos con déficit o bajo stock mínimo`}
            >
              <AlertTriangle size={15} />
              <span>Pedido Sugerido ({faltantes})</span>
            </Link>
          )}
          <Link className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href="/compras/pedidos/nuevo">
            <Plus size={15} />
            Nuevo Pedido de Compra
          </Link>
        </div>
      }
    >
      <SubnavCompras />
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

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
            placeholder="Buscar por proveedor o folio (PED-...)..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-brand-yellow focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Estado:</label>
          <select
            name="estado"
            defaultValue={sp.estado || ""}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none"
          >
            <option value="">Todos los Estados</option>
            <option value="EMITIDO">Emitido</option>
            <option value="PARCIAL">Parcial</option>
            <option value="RECIBIDO">Recibido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <button type="submit" className="btn btn-navy h-10 px-3 text-xs font-bold">
            Filtrar
          </button>
        </div>
      </form>

      <TablaPedidosCompra pedidos={filasFiltradas} />

      <div className="mt-4">
        <Paginacion page={hoja.page} pages={hoja.pages} total={hoja.total} ruta="/compras/pedidos" />
      </div>
    </PageDocument>
  );
}
