"use client";

import type { ProductoVista } from "@/lib/types";

interface CamposIdentificacionProductoProps {
  articuloEditando: ProductoVista | null;
  categoriasDisponibles: string[];
}

export function CamposIdentificacionProducto({
  articuloEditando,
  categoriasDisponibles,
}: CamposIdentificacionProductoProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Código Único <span className="text-amber-500">*</span>
        </label>
        <input
          type="text"
          name="codigo"
          required
          defaultValue={articuloEditando?.codigo || ""}
          placeholder="Ej. HER-001"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono placeholder-slate-400 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Código de Barras (Opcional)
        </label>
        <input
          type="text"
          name="codigoBarras"
          defaultValue={articuloEditando?.codigoBarras || ""}
          placeholder="Ej. 742100123456"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono placeholder-slate-400 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Categoría <span className="text-amber-500">*</span>
        </label>
        <input
          type="text"
          name="categoria"
          required
          list="modal-categorias"
          defaultValue={articuloEditando?.categoria || "Ferretería General"}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
        />
        <datalist id="modal-categorias">
          {categoriasDisponibles.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
