import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  History,
  Layers,
  Package,
  Printer,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Aviso, PageDocument, Paginacion } from "@/components/documentos/Pieza";
import { TablaKardex } from "@/components/documentos/TablaKardex";
import { numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import type { OrigenMovimiento, TipoMovimiento } from "@/lib/types";

export const metadata = { title: "Kárdex de Inventario - Ferretería Emmanuel" };

export default async function KardexPage({
  searchParams,
}: {
  searchParams: Promise<{
    producto?: string;
    codigo?: string;
    codigoBarras?: string;
    desde?: string;
    hasta?: string;
    tipo?: string;
    origen?: string;
    referencia?: string;
    busqueda?: string;
    auditoria?: string;
    page?: string;
    aviso?: string;
  }>;
}) {
  const sp = await searchParams;

  const [hoja, catalogo, productoSel] = await Promise.all([
    api.kardex({
      productoId: sp.producto,
      codigo: sp.codigo,
      codigoBarras: sp.codigoBarras,
      desde: sp.desde,
      hasta: sp.hasta,
      tipo: (sp.tipo || undefined) as TipoMovimiento | undefined,
      origen: (sp.origen || undefined) as OrigenMovimiento | undefined,
      referencia: sp.referencia,
      busqueda: sp.busqueda,
      soloAuditoria: sp.auditoria === "1",
      page: sp.page ? Number(sp.page) : "ultima",
    }),
    api.catalogo(),
    sp.producto ? api.producto(sp.producto) : Promise.resolve(null),
  ]);

  // Construcción de query string con todos los filtros activos
  const consulta = new URLSearchParams();
  if (sp.producto) consulta.set("producto", sp.producto);
  if (sp.codigo) consulta.set("codigo", sp.codigo);
  if (sp.codigoBarras) consulta.set("codigoBarras", sp.codigoBarras);
  if (sp.desde) consulta.set("desde", sp.desde);
  if (sp.hasta) consulta.set("hasta", sp.hasta);
  if (sp.tipo) consulta.set("tipo", sp.tipo);
  if (sp.origen) consulta.set("origen", sp.origen);
  if (sp.referencia) consulta.set("referencia", sp.referencia);
  if (sp.busqueda) consulta.set("busqueda", sp.busqueda);
  if (sp.auditoria) consulta.set("auditoria", sp.auditoria);

  const queryParamsObj: Record<string, string | undefined> = {
    producto: sp.producto,
    codigo: sp.codigo,
    codigoBarras: sp.codigoBarras,
    desde: sp.desde,
    hasta: sp.hasta,
    tipo: sp.tipo,
    origen: sp.origen,
    referencia: sp.referencia,
    busqueda: sp.busqueda,
    auditoria: sp.auditoria,
  };

  const totalEntradas = hoja.rows.reduce((acc, m) => acc + (m.entradas || 0), 0);
  const totalSalidas = hoja.rows.reduce((acc, m) => acc + (m.salidas || 0), 0);
  const enAuditoria = hoja.rows.filter((m) => m.esAuditoria).length;

  return (
    <PageDocument
      seccion="Auditoría y Trazabilidad de Existencias"
      titulo="Kárdex de Inventario"
      folio={`KDX-PÁG-${hoja.page}`}
      ancho="pliego"
      acciones={
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            className="btn btn-linea h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]"
            href={`/api/kardex/exportar?${consulta.toString()}`}
            title="Exportar movimientos a Excel nativo (.xls)"
          >
            <Download size={14} />
            Exportar Excel
          </Link>
          <Link
            className="btn btn-amarillo h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]"
            href={`/kardex/imprimir?${consulta.toString()}`}
            title="Imprimir Kárdex oficial con filtros aplicados"
          >
            <Printer size={14} />
            Imprimir Kárdex
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}

      {/* Tarjetas de Indicadores Rápidos (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Movimientos</span>
            <History size={15} className="text-slate-400" />
          </div>
          <p className="text-lg font-black text-slate-900 font-mono">{hoja.total}</p>
          <span className="text-[10px] text-slate-400">en esta consulta</span>
        </div>

        <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Entradas Físicas</span>
            <ArrowUpRight size={15} className="text-emerald-500" />
          </div>
          <p className="text-lg font-black text-emerald-700 font-mono">+{numero(totalEntradas)}</p>
          <span className="text-[10px] text-slate-400">unidades ingresadas</span>
        </div>

        <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Salidas Físicas</span>
            <ArrowDownLeft size={15} className="text-rose-500" />
          </div>
          <p className="text-lg font-black text-rose-700 font-mono">-{numero(totalSalidas)}</p>
          <span className="text-[10px] text-slate-400">unidades despachadas</span>
        </div>

        <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {productoSel ? "Stock en Bodega" : "Saldo de Página"}
            </span>
            <Package size={15} className="text-blue-500" />
          </div>
          <p className="text-lg font-black text-slate-900 font-mono">
            {productoSel
              ? `${numero(productoSel.stockActual)}`
              : hoja.rows.length > 0
              ? `${numero(hoja.rows[hoja.rows.length - 1].stockSaldo)}`
              : "0.00"}
          </p>
          <span className="text-[10px] text-slate-400 truncate block">
            {productoSel ? `${productoSel.unidadMedida} disponibles` : "balance actual"}
          </span>
        </div>

        <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">En Auditoría</span>
            <ShieldAlert size={15} className="text-amber-500" />
          </div>
          <p className={`text-lg font-black font-mono ${enAuditoria > 0 ? "text-amber-600" : "text-slate-400"}`}>
            {enAuditoria}
          </p>
          <span className="text-[10px] text-slate-400">renglones señalados</span>
        </div>
      </div>

      {/* Barra de Filtros Profesionales Combinables */}
      <div className="no-print mb-5 bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Filtros Avanzados de Movimientos
            </h3>
          </div>
          <Link
            href="/kardex"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <RotateCcw size={13} />
            Limpiar Filtros
          </Link>
        </div>

        <form action="/kardex" method="GET" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Selector de Producto */}
          <label className="sm:col-span-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Artículo / Catálogo
            </span>
            <select
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
              name="producto"
              defaultValue={sp.producto || ""}
            >
              <option value="">Todo el libro general de existencias</option>
              {catalogo.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.codigo} · {item.nombre}
                </option>
              ))}
            </select>
          </label>

          {/* 2. Búsqueda Rápida */}
          <label className="sm:col-span-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Búsqueda Rápida (Texto / Destino / Concepto)
            </span>
            <div className="relative">
              <input
                className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
                type="text"
                name="busqueda"
                placeholder="Buscar por concepto, cliente, folio o responsable..."
                defaultValue={sp.busqueda || ""}
              />
              <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
            </div>
          </label>

          {/* 3. Código Interno */}
          <label>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Código Interno
            </span>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow focus:bg-white font-mono"
              type="text"
              name="codigo"
              placeholder="Ej: HER-001"
              defaultValue={sp.codigo || ""}
            />
          </label>

          {/* 4. Código de Barras */}
          <label>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Código de Barras (Escáner)
            </span>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow focus:bg-white font-mono"
              type="text"
              name="codigoBarras"
              placeholder="Escanear o digitar..."
              defaultValue={sp.codigoBarras || ""}
            />
          </label>

          {/* 5. Fecha Desde */}
          <label>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Fecha Desde
            </span>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
              type="date"
              name="desde"
              defaultValue={sp.desde || ""}
            />
          </label>

          {/* 6. Fecha Hasta */}
          <label>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Fecha Hasta
            </span>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
              type="date"
              name="hasta"
              defaultValue={sp.hasta || ""}
            />
          </label>

          {/* 7. Tipo de Movimiento */}
          <label>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tipo de Movimiento
            </span>
            <select
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
              name="tipo"
              defaultValue={sp.tipo || ""}
            >
              <option value="">Todos los tipos</option>
              <option value="ENTRADA">Entrada (Ingresos / Compras)</option>
              <option value="SALIDA">Salida (Ventas / Despachos)</option>
              <option value="AJUSTE">Ajuste (Conciliación)</option>
            </select>
          </label>

          {/* 8. Origen Documental */}
          <label>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Origen Documental
            </span>
            <select
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow focus:bg-white"
              name="origen"
              defaultValue={sp.origen || ""}
            >
              <option value="">Todos los orígenes</option>
              <option value="FACTURA">Facturación / Ventas (POS)</option>
              <option value="COMPRA">Compras Oficiales</option>
              <option value="AJUSTE">Ajuste de Inventario</option>
              <option value="SOLICITUD">Solicitud de Material</option>
              <option value="SALIDA_DIRECTA">Salida Directa / Acta</option>
              <option value="MANUAL">Entrada Manual Bodega</option>
              <option value="EXCEL">Carga Histórica Excel</option>
            </select>
          </label>

          {/* 9. Folio / Referencia */}
          <label>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Folio o Referencia
            </span>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow focus:bg-white font-mono"
              type="text"
              name="referencia"
              placeholder="FAC-..., COM-..., AJU-..."
              defaultValue={sp.referencia || ""}
            />
          </label>

          {/* Acciones del Formulario */}
          <div className="flex items-end justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pb-2">
              <input
                type="checkbox"
                name="auditoria"
                value="1"
                defaultChecked={sp.auditoria === "1"}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              Solo auditoría
            </label>

            <button type="submit" className="btn btn-navy h-9 px-4 text-xs font-bold gap-1.5 shadow-2xs shrink-0 rounded-[5px]">
              <Filter size={14} />
              Aplicar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Movimientos Inmutable */}
      <TablaKardex filas={hoja.rows} />

      {/* Pie de Auditoría e Inmutabilidad */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <p className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-rose-500" />
          Renglones resaltados indican movimientos bajo revisión o auditoría interna.
        </p>
        <p className="font-medium text-slate-600">
          Historial inmutable oficial · Ferretería Emmanuel
        </p>
      </div>

      {/* Paginación con Parámetros Persistidos */}
      <div className="mt-5">
        <Paginacion
          page={hoja.page}
          pages={hoja.pages}
          total={hoja.total}
          ruta="/kardex"
          params={queryParamsObj}
        />
      </div>
    </PageDocument>
  );
}
