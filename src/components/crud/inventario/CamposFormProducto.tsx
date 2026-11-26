"use client";

import { etiquetaUnidad, numero, UNIDADES } from "@/lib/format";
import type { ProductoVista } from "@/lib/types";
import { CamposIdentificacionProducto } from "./CamposIdentificacionProducto";
import { CamposPreciosMargen } from "./CamposPreciosMargen";

interface CamposFormProductoProps {
  articuloEditando: ProductoVista | null;
  categoriasDisponibles: string[];
  marcasOpciones: string[];
  costoModal: number;
  setCostoModal: (costo: number) => void;
  precioModal: number;
  setPrecioModal: (precio: number) => void;
  esAdmin: boolean;
}

export function CamposFormProducto({
  articuloEditando,
  categoriasDisponibles,
  marcasOpciones,
  costoModal,
  setCostoModal,
  precioModal,
  setPrecioModal,
  esAdmin,
}: CamposFormProductoProps) {
  return (
    <>
      {articuloEditando && <input type="hidden" name="id" value={articuloEditando.id} />}

      <CamposIdentificacionProducto
        articuloEditando={articuloEditando}
        categoriasDisponibles={categoriasDisponibles}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Nombre o Descripción Comercial <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            required
            defaultValue={articuloEditando?.nombre || ""}
            placeholder="Ej. Martillo de Uña 16oz Mango Fibra de Vidrio"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Marca / Fabricante
          </label>
          <input
            type="text"
            name="marca"
            list="modal-marcas"
            defaultValue={articuloEditando?.marca || "Genérica"}
            placeholder="Ej. Truper, Stanley..."
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
          />
          <datalist id="modal-marcas">
            {marcasOpciones.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Unidad de Medida
          </label>
          <select
            name="unidadMedida"
            defaultValue={articuloEditando?.unidadMedida || "UNIDAD"}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {etiquetaUnidad(u)} ({u})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            {articuloEditando ? "Existencia Actual (Informativa)" : "Stock Inicial en Bodega"}
          </label>
          {articuloEditando ? (
            <>
              <input
                type="text"
                disabled
                readOnly
                value={`${numero(articuloEditando.stockActual)} ${etiquetaUnidad(articuloEditando.unidadMedida)}`}
                className="h-10 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm text-slate-500 font-mono cursor-not-allowed outline-none"
              />
              <input type="hidden" name="inventarioInicial" value={articuloEditando.inventarioInicial ?? 0} />
            </>
          ) : (
            <input
              type="number"
              step="any"
              name="inventarioInicial"
              defaultValue={0}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Stock Mínimo Alerta
          </label>
          <input
            type="number"
            step="any"
            name="stockMinimo"
            defaultValue={articuloEditando?.stockMinimo ?? 5}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
          />
        </div>
      </div>

      <CamposPreciosMargen
        costoModal={costoModal}
        setCostoModal={setCostoModal}
        precioModal={precioModal}
        setPrecioModal={setPrecioModal}
        esAdmin={esAdmin}
      />
    </>
  );
}
