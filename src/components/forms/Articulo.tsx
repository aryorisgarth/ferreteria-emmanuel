"use client";

import { useMemo, useState } from "react";
import { DollarSign, Layers, Package, Percent, Save, ShieldAlert } from "lucide-react";
import { altaAction, editarArticuloAction } from "@/app/actions";
import { Aviso } from "@/components/documentos/Pieza";
import { UNIDADES, dinero, etiquetaUnidad, numero } from "@/lib/format";
import type { ProductoVista, UnidadMedida } from "@/lib/types";

export function FormularioArticulo({
  categorias,
  articulo,
  error,
}: {
  categorias: string[];
  articulo?: ProductoVista;
  error?: string;
}) {
  const [costo, setCosto] = useState<number>(articulo?.costo ?? 0);
  const [precio, setPrecio] = useState<number>(articulo?.precio ?? 0);
  const [stockMinimo, setStockMinimo] = useState<number>(articulo?.stockMinimo ?? 5);

  const margen = useMemo(() => {
    if (precio <= 0 || costo <= 0) return null;
    const m = ((precio - costo) / precio) * 100;
    return Math.round(m * 10) / 10;
  }, [costo, precio]);

  const utilidadMonto = useMemo(() => {
    if (precio <= 0 || costo <= 0) return 0;
    return Math.max(0, precio - costo);
  }, [costo, precio]);

  return (
    <form
      action={articulo ? editarArticuloAction : altaAction}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6"
    >
      {articulo ? <input type="hidden" name="id" value={articulo.id} /> : null}
      {error ? <Aviso tono="rojo">{error}</Aviso> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Código Único del Artículo
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs font-bold text-slate-900 outline-none focus:border-brand-yellow"
            name="codigo"
            defaultValue={articulo?.codigo}
            placeholder="Ej. HER-001"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Código de Barras (Opcional)
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs text-slate-900 outline-none focus:border-brand-yellow"
            name="codigoBarras"
            defaultValue={articulo?.codigoBarras ?? ""}
            placeholder="Ej. 7430001234567"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Nombre / Descripción del Artículo
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-brand-yellow"
            name="nombre"
            defaultValue={articulo?.nombre}
            placeholder="Ej. Martillo de Uña 16oz Stanley"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Categoría
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
            name="categoria"
            list="categorias-list"
            defaultValue={articulo?.categoria || "Ferretería General"}
            required
          />
          <datalist id="categorias-list">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Marca / Fabricante
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
            name="marca"
            list="marcas-list"
            defaultValue={articulo?.marca || "Genérica"}
            placeholder="Ej. Truper, Stanley, Amanco, Holcim..."
          />
          <datalist id="marcas-list">
            {[
              "Truper",
              "Stanley",
              "DeWalt",
              "Makita",
              "Bosch",
              "Amanco",
              "Durman",
              "Holcim",
              "Cemento Canal",
              "Sur",
              "Corona",
              "Sika",
              "3M",
              "Bellota",
              "Pretul",
              "Bticino",
              "Genérica",
            ].map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Unidad de Medida
          </label>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
            name="unidadMedida"
            defaultValue={articulo?.unidadMedida || "UNIDAD"}
          >
            {UNIDADES.map((unidad) => (
              <option key={unidad} value={unidad}>
                {etiquetaUnidad(unidad)} ({unidad})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            {articulo ? "Existencia Actual en Bodega (Solo Lectura)" : "Stock Inicial en Bodega"}
          </label>
          {articulo ? (
            <>
              <input
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 font-mono text-xs font-bold text-slate-600 outline-none cursor-not-allowed"
                value={`${numero(articulo.stockActual)} ${etiquetaUnidad(articulo.unidadMedida)}`}
                readOnly
                disabled
              />
              <input
                type="hidden"
                name="inventarioInicial"
                value={articulo.inventarioInicial ?? 0}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Informativo. Las existencias se actualizan únicamente mediante Compras, Ventas o Kárdex.
              </p>
            </>
          ) : (
            <input
              className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs font-bold text-slate-900 outline-none focus:border-brand-yellow"
              name="inventarioInicial"
              inputMode="decimal"
              defaultValue="0"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Alerta de Stock Mínimo
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-xs font-bold text-slate-900 outline-none focus:border-brand-yellow"
            name="stockMinimo"
            type="number"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(Number(e.target.value) || 0)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Costo Unitario (C$)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              C$
            </span>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 font-mono text-xs font-bold text-slate-900 outline-none focus:border-brand-yellow"
              name="costo"
              inputMode="decimal"
              type="number"
              step="any"
              value={costo || ""}
              onChange={(e) => setCosto(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Precio de Venta al Público (C$)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              C$
            </span>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 font-mono text-xs font-bold text-slate-900 outline-none focus:border-brand-yellow"
              name="precio"
              inputMode="decimal"
              type="number"
              step="any"
              value={precio || ""}
              onChange={(e) => setPrecio(Number(e.target.value) || 0)}
              required
            />
          </div>
        </div>
      </div>

      {/* Widget de Rentabilidad y Margen */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Análisis de Rentabilidad Comercial
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Margen Bruto</p>
            <p
              className={`text-base font-extrabold font-mono ${
                margen !== null && margen < 15
                  ? "text-rose-600"
                  : margen !== null && margen >= 30
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {margen !== null ? `${margen}%` : "—"}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">Ganancia por Unidad</p>
            <p className="text-base font-extrabold font-mono text-slate-800">
              {utilidadMonto > 0 ? dinero(utilidadMonto) : "—"}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Estado de Margen</p>
            <p className="text-xs font-bold text-slate-700 mt-1">
              {margen !== null && margen >= 30
                ? "Óptimo (≥ 30%)"
                : margen !== null && margen >= 15
                ? "Aceptable (15% - 29%)"
                : margen !== null
                ? "Bajo (< 15%)"
                : "Definir costo/precio"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-2 shadow-xs"
        >
          <Save size={16} />
          {articulo ? "Guardar Modificaciones" : "Registrar Nuevo Artículo"}
        </button>
      </div>
    </form>
  );
}
