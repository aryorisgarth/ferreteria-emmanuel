"use client";

import { useActionState, useState } from "react";
import {
  crearSolicitudAction,
  directaAction,
  editarAction,
  entradaAction,
  importarAction,
} from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { CapturaLineas, type OpcionProducto } from "@/components/forms/CapturaLineas";
import { Aviso } from "@/components/documentos/Pieza";
import type { MovimientoVista, Oficina } from "@/lib/types";

const inicial: ResultadoAccion = null;

export function FormularioSolicitud({
  catalogo,
  oficinas,
  fecha,
}: {
  catalogo: OpcionProducto[];
  oficinas: Oficina[];
  fecha: string;
}) {
  const [estado, accion, pendiente] = useActionState(crearSolicitudAction, inicial);
  return (
    <form action={accion} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">Nueva Solicitud de Despacho de Material</h2>
        <p className="text-xs text-slate-500">
          Registra el requerimiento pendiente de aprobación por el encargado de bodega.
        </p>
      </div>
      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Solicitante (Quien requiere)
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
            name="solicitante"
            required
            placeholder="Ej. Ing. Carlos Mendoza"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Fecha de Requerimiento
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
            type="date"
            name="fecha"
            defaultValue={fecha}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Dependencia / Obra / Área
          </label>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
            name="oficinaId"
            required
          >
            {oficinas.map((oficina) => (
              <option key={oficina.id} value={oficina.id}>
                {oficina.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Destinatario Final / Responsable
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
            name="destinatario"
            placeholder="Persona, cuadrilla o encargado"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Observaciones o Justificación
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-brand-yellow"
            name="observaciones"
            rows={2}
            placeholder="Indica el motivo o destino de estos materiales..."
          />
        </div>
      </div>
      <div className="border-t border-slate-100 pt-3">
        <CapturaLineas catalogo={catalogo} />
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-500">
          Nota: El requerimiento queda en estado pendiente y no descarga el inventario hasta su aprobación y emisión de acta.
        </p>
        <button
          className="btn btn-azul h-10 px-5 text-xs font-bold shadow-xs disabled:opacity-50"
          disabled={pendiente}
        >
          {pendiente ? "Creando…" : "Registrar Solicitud"}
        </button>
      </div>
    </form>
  );
}

export function FormularioEntrada({ catalogo, fecha }: { catalogo: OpcionProducto[]; fecha: string }) {
  const [estado, accion, pendiente] = useActionState(entradaAction, inicial);
  return (
    <form action={accion} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">Entrada Rápida a Bodega</h2>
        <p className="text-xs text-slate-500">Módulo de control de almacén para recepciones de mercadería.</p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
        <strong>Aviso de Valoración Contable:</strong> Las compras comerciales a distribuidores deben registrarse formalmente a través del módulo de <strong>Compras</strong> para actualizar el Costo Promedio Ponderado (CPP) con su factura y proveedor oficial.
      </div>
      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Artículo</label>
          <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow" name="productoId">
            {catalogo.map((item) => (
              <option key={item.id} value={item.id}>
                {item.codigo} · {item.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Cantidad</label>
          <input className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-bold font-mono text-slate-800 outline-none focus:border-brand-yellow" name="cantidad" inputMode="decimal" required defaultValue="1" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Fecha</label>
          <input className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono" type="date" name="fecha" defaultValue={fecha} required />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Concepto / Motivo</label>
          <input className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow" name="concepto" required placeholder="Compra, devolución o ajuste de conteo físico" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <input type="checkbox" name="esAuditoria" className="text-amber-500" />
        Marcar en auditoría (observación especial)
      </label>
      <div className="flex justify-end pt-2">
        <button className="btn btn-azul h-10 px-5 text-xs font-bold shadow-xs disabled:opacity-50" disabled={pendiente}>
          {pendiente ? "Registrando…" : "Registrar Entrada a Bodega"}
        </button>
      </div>
    </form>
  );
}

export function FormularioSalidaDirecta({
  catalogo,
  oficinas,
  fecha,
}: {
  catalogo: OpcionProducto[];
  oficinas: Oficina[];
  fecha: string;
}) {
  const [estado, accion, pendiente] = useActionState(directaAction, inicial);
  return (
    <form action={accion} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">Salida Directa de Despacho</h2>
        <p className="text-xs text-slate-500">Emite un acta automática de entrega y descuenta el stock de inmediato.</p>
      </div>
      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Destinatario / Receptor</label>
          <input className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow" name="destinatario" required placeholder="Persona, cuadrilla o encargado" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Dependencia / Obra</label>
          <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow" name="oficinaId">
            {oficinas.map((oficina) => (
              <option key={oficina.id} value={oficina.id}>
                {oficina.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Fecha</label>
          <input className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono" type="date" name="fecha" defaultValue={fecha} required />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Concepto de Salida</label>
          <input className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow" name="concepto" required placeholder="Despacho para obra, uso interno..." />
        </div>
      </div>
      <div className="border-t border-slate-100 pt-3">
        <CapturaLineas catalogo={catalogo} />
      </div>
      <div className="flex justify-end pt-2">
        <button className="btn btn-amarillo h-10 px-5 text-xs font-bold shadow-xs disabled:opacity-50" disabled={pendiente}>
          {pendiente ? "Despachando…" : "Despachar y Emitir Acta"}
        </button>
      </div>
    </form>
  );
}

export function FormularioExcel({ fecha }: { fecha: string }) {
  const [estado, accion, pendiente] = useActionState(importarAction, inicial);
  const [texto, setTexto] = useState(`FE-009,ENTRADA,25,${fecha},,Compra de tornillos`);

  const cargarArchivoCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result as string;
      if (contenido) setTexto(contenido.trim());
    };
    reader.readAsText(file);
  };

  const parseadas = texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const [codigo, tipo, cantidad, dia, destinatario, concepto] = linea.split(",");
      return {
        codigo: (codigo || "").trim(),
        tipo: (tipo || "").trim().toUpperCase(),
        cantidad: Number(cantidad),
        fecha: (dia || fecha).trim(),
        destinatario: (destinatario || "").trim(),
        concepto: (concepto || "").trim(),
      };
    });

  return (
    <form action={accion} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">Carga Masiva CSV / Portapapeles</h2>
          <p className="text-xs text-slate-500">
            Formato por línea: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">codigo, tipo, cantidad, fecha, destinatario, concepto</code>.
          </p>
        </div>
        <label className="btn btn-linea h-8 px-3 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shrink-0">
          <span>📁 Cargar archivo .CSV</span>
          <input type="file" accept=".csv,.txt" onChange={cargarArchivoCsv} className="hidden" />
        </label>
      </div>
      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}
      <textarea
        className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-800 outline-none focus:border-brand-yellow leading-relaxed"
        rows={6}
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder="Pega aquí tus líneas en formato CSV o selecciona un archivo..."
      />
      <input type="hidden" name="filas" value={JSON.stringify(parseadas)} />
      <div className="flex justify-between items-center pt-2">
        <span className="text-xs text-slate-500">{parseadas.length} renglones válidos detectados</span>
        <button
          className="btn btn-linea h-10 px-5 text-xs font-bold shadow-xs disabled:opacity-50"
          disabled={pendiente}
        >
          {pendiente ? "Cargando…" : "Importar Renglones"}
        </button>
      </div>
    </form>
  );
}

export function FormularioEdicion({
  mov,
  oficinas,
}: {
  mov: MovimientoVista;
  oficinas: Oficina[];
}) {
  const [estado, accion, pendiente] = useActionState(editarAction, inicial);
  const esInmutable =
    mov.origen === "FACTURA" ||
    mov.origen === "COMPRA" ||
    mov.origen === "AJUSTE" ||
    (mov.idempotencyKey &&
      (mov.idempotencyKey.startsWith("FACTURA") ||
        mov.idempotencyKey.startsWith("COMPRA") ||
        mov.idempotencyKey.startsWith("ANULA") ||
        mov.idempotencyKey.startsWith("AJUSTE")));

  return (
    <form action={accion} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">Auditoría de Renglón de Kárdex</h2>
        <p className="text-xs text-slate-500">
          Revisión y marcado de auditoría para el artículo {mov.codigo}.
        </p>
      </div>

      {esInmutable && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
          <strong>Renglón Inmutable:</strong> Este movimiento fue generado por un documento o ajuste oficial ({mov.numeroReferencia || mov.id}). Por trazabilidad contable, fiscal y de auditoría física, sus registros históricos no pueden modificarse.
        </div>
      )}

      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}
      <input type="hidden" name="id" value={mov.id} />
      <input type="hidden" name="cantidad" value={String(mov.cantidad)} />
      <input type="hidden" name="fecha" value={mov.fecha} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Cantidad (Inmutable)
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-bold font-mono text-slate-600 outline-none cursor-not-allowed"
            value={String(mov.cantidad)}
            readOnly
            disabled
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Protegido. Los saldos del Kárdex son inmutables.
          </span>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Fecha (Inmutable)
          </label>
          <input
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs text-slate-600 outline-none font-mono cursor-not-allowed"
            value={mov.fecha}
            readOnly
            disabled
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Fecha original de asentamiento.
          </span>
        </div>
        {mov.tipo === "SALIDA" ? (
          <>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Destinatario</label>
              <input
                className={`h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow ${
                  esInmutable ? "bg-slate-100 cursor-not-allowed" : ""
                }`}
                name="destinatario"
                defaultValue={mov.destinatario}
                readOnly={Boolean(esInmutable)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Dependencia</label>
              <select
                className={`h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow ${
                  esInmutable ? "bg-slate-100 cursor-not-allowed" : ""
                }`}
                name="oficinaId"
                defaultValue={mov.oficinaId ?? ""}
                disabled={Boolean(esInmutable)}
              >
                <option value="">Sin catálogo</option>
                {oficinas.map((oficina) => (
                  <option key={oficina.id} value={oficina.id}>
                    {oficina.nombre}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <input type="hidden" name="destinatario" value="" />
        )}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Concepto / Glosa</label>
          <input
            className={`h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow ${
              esInmutable ? "bg-slate-100 cursor-not-allowed" : ""
            }`}
            name="concepto"
            defaultValue={mov.concepto}
            readOnly={Boolean(esInmutable)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Estado de Auditoría</label>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
            name="estadoAuditoria"
            defaultValue={mov.estadoAuditoria}
          >
            <option value="NORMAL">Normal</option>
            <option value="EN_AUDITORIA">En Auditoría</option>
            <option value="OBSERVADO">Observado / En Revisión</option>
          </select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              name="esAuditoria"
              defaultChecked={mov.esAuditoria}
              className="rounded border-slate-300 text-amber-600 focus:ring-brand-yellow"
            />
            Marcar este renglón bajo auditoría física
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="btn btn-amarillo h-10 px-6 text-xs font-bold shadow-xs disabled:opacity-50"
          disabled={Boolean(esInmutable || pendiente)}
        >
          {pendiente ? "Guardando..." : "Actualizar Auditoría"}
        </button>
      </div>
    </form>
  );
}
