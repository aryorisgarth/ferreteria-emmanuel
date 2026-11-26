"use client";

import { etiquetaUnidad, numero } from "@/lib/format";
import type { ProductoVista, TipoAjusteInventario } from "@/lib/types";
import { AlertaCostoReferenciaAjuste } from "./AlertaCostoReferenciaAjuste";

interface CamposFormAjusteProps {
  productosIniciales: ProductoVista[];
  ajusteProductoId: string;
  setAjusteProductoId: (id: string) => void;
  ajusteTipo: TipoAjusteInventario;
  setAjusteTipo: (t: TipoAjusteInventario) => void;
  ajusteSigno: 1 | -1;
  setAjusteSigno: (s: 1 | -1) => void;
  ajusteCantidad: number;
  setAjusteCantidad: (c: number) => void;
  ajusteMotivo: string;
  setAjusteMotivo: (m: string) => void;
  ajusteCostoReferencia: number;
  setAjusteCostoReferencia: (c: number) => void;
  productoSeleccionado: ProductoVista | undefined;
  stockProyectado: number;
  signoEfectivo: number;
}

export function CamposFormAjuste({
  productosIniciales,
  ajusteProductoId,
  setAjusteProductoId,
  ajusteTipo,
  setAjusteTipo,
  ajusteSigno,
  setAjusteSigno,
  ajusteCantidad,
  setAjusteCantidad,
  ajusteMotivo,
  setAjusteMotivo,
  ajusteCostoReferencia,
  setAjusteCostoReferencia,
  productoSeleccionado,
  stockProyectado,
  signoEfectivo,
}: CamposFormAjusteProps) {
  return (
    <>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Artículo a Ajustar <span className="text-amber-500">*</span>
        </label>
        <select
          name="productoId" value={ajusteProductoId} onChange={(e) => setAjusteProductoId(e.target.value)}
          required className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-brand-yellow"
        >
          {productosIniciales.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} - {p.nombre} (Stock: {numero(p.stockActual)} {etiquetaUnidad(p.unidadMedida)})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Tipo de Ajuste <span className="text-amber-500">*</span>
          </label>
          <select
            name="tipo" value={ajusteTipo} onChange={(e) => setAjusteTipo(e.target.value as TipoAjusteInventario)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-brand-yellow"
          >
            <option value="SOBRANTE">Sobrante (+ Entrada)</option>
            <option value="FALTANTE">Faltante (- Salida)</option>
            <option value="DANO">Daño / Avería (- Salida)</option>
            <option value="MERMA">Merma natural (- Salida)</option>
            <option value="CORRECCION">Corrección Manual</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Fecha <span className="text-amber-500">*</span>
          </label>
          <input
            type="date" name="fecha" defaultValue={new Date().toISOString().slice(0, 10)} required
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-brand-yellow"
          />
        </div>
      </div>

      {ajusteTipo === "CORRECCION" && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Sentido</label>
          <select
            name="signo" value={ajusteSigno} onChange={(e) => setAjusteSigno(Number(e.target.value) as 1 | -1)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-brand-yellow"
          >
            <option value="1">Incrementar Existencias (+ Entrada)</option>
            <option value="-1">Disminuir Existencias (- Salida)</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Cantidad <span className="text-amber-500">*</span>
          </label>
          <input
            type="number" step="any" min="0.001" name="cantidad" value={ajusteCantidad}
            onChange={(e) => setAjusteCantidad(Math.max(0, Number(e.target.value)))} required
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-mono text-slate-900 outline-none focus:border-brand-yellow"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Previsualización</label>
          <div className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">{productoSeleccionado ? numero(productoSeleccionado.stockActual) : 0}</span>
            <span className="text-slate-400">→</span>
            <span className={`font-bold ${stockProyectado < 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {numero(stockProyectado)} {productoSeleccionado ? etiquetaUnidad(productoSeleccionado.unidadMedida) : ""}
            </span>
          </div>
        </div>
      </div>

      <AlertaCostoReferenciaAjuste
        signoEfectivo={signoEfectivo} productoSeleccionado={productoSeleccionado}
        ajusteCostoReferencia={ajusteCostoReferencia} setAjusteCostoReferencia={setAjusteCostoReferencia}
      />

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Motivo Obligatorio <span className="text-amber-500">*</span>
        </label>
        <textarea
          name="motivo" required rows={3} value={ajusteMotivo} onChange={(e) => setAjusteMotivo(e.target.value)}
          placeholder="Describa la causa del ajuste (ej. Rotura accidental, diferencia en conteo)..."
          className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-yellow"
        />
      </div>
    </>
  );
}
