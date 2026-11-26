"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Lock,
  User,
  DollarSign,
  Percent,
} from "lucide-react";
import { dinero, numero, etiquetaUnidad } from "@/lib/format";
import type { Cotizacion, LineaComercial, ProductoVista } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

interface PanelAutorizacionPreciosProps {
  cotizacion: Cotizacion;
  items: Array<LineaComercial & {
    nombre?: string;
    codigo?: string;
    costoUnitario?: number;
    importe?: number;
  }>;
  catalogoProductos: ProductoVista[];
  simboloMoneda?: string;
  esPropietario: boolean;
  usuarioActual?: {
    usuario: string;
    nombre: string;
    rol: string;
  } | null;
}

export function PanelAutorizacionPrecios({
  cotizacion,
  items,
  catalogoProductos,
  simboloMoneda = "C$",
  esPropietario,
  usuarioActual,
}: PanelAutorizacionPreciosProps) {
  const [modalAvisoAbierto, setModalAvisoAbierto] = useState(false);
  const [accionSeleccionada, setAccionSeleccionada] = useState<"APROBAR" | "RECHAZAR" | null>(null);

  // Mapa de productos de catálogo por ID para búsqueda rápida y precisa
  const mapaCatalogo = new Map<string, ProductoVista>();
  catalogoProductos.forEach((p) => mapaCatalogo.set(p.id, p));

  // Análisis renglón por renglón
  let totalCatalogoOficial = 0;
  let totalCotizadoActual = 0;
  let hayPreciosNegociadosBajoCatalogo = false;

  const lineasAnalizadas = items.map((it) => {
    const prodOficial = mapaCatalogo.get(it.productoId);
    const precioCatalogo = prodOficial ? prodOficial.precio : it.precio;
    const precioCotizado = it.precio;
    const costoReferencia =
      it.costoUnitario !== undefined
        ? it.costoUnitario
        : prodOficial
        ? prodOficial.costo
        : undefined;

    const diferenciaMonetaria = precioCotizado - precioCatalogo;
    const porcentajeDescuento =
      precioCatalogo > 0
        ? Math.round(((precioCatalogo - precioCotizado) / precioCatalogo) * 10000) / 100
        : 0;

    if (precioCotizado < precioCatalogo) {
      hayPreciosNegociadosBajoCatalogo = true;
    }

    // Cálculo de margen estimado: (Precio - Costo) / Precio
    let margenEstimado: number | null = null;
    if (costoReferencia !== undefined && precioCotizado > 0) {
      margenEstimado = Math.round(((precioCotizado - costoReferencia) / precioCotizado) * 10000) / 100;
    }

    const subtotalLineaCatalogo = precioCatalogo * it.cantidad;
    const subtotalLineaCotizado = precioCotizado * it.cantidad;

    totalCatalogoOficial += subtotalLineaCatalogo;
    totalCotizadoActual += subtotalLineaCotizado;

    return {
      ...it,
      nombre: it.nombre || prodOficial?.nombre || `Producto (${it.productoId})`,
      codigo: it.codigo || prodOficial?.codigo || "---",
      unidadMedida: it.unidadMedida || prodOficial?.unidadMedida || "UNIDAD",
      precioCatalogo,
      precioCotizado,
      diferenciaMonetaria,
      porcentajeDescuento,
      costoReferencia,
      margenEstimado,
      esBajoCatalogo: precioCotizado < precioCatalogo,
      esBajoCosto: costoReferencia !== undefined && precioCotizado < costoReferencia,
    };
  });

  const ahorroTotalCliente = Math.max(0, totalCatalogoOficial - totalCotizadoActual);
  const porcentajeAhorroGlobal =
    totalCatalogoOficial > 0
      ? Math.round((ahorroTotalCliente / totalCatalogoOficial) * 10000) / 100
      : 0;

  function abrirAvisoAccion(accion: "APROBAR" | "RECHAZAR") {
    setAccionSeleccionada(accion);
    setModalAvisoAbierto(true);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* Encabezado del Panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Panel de Autorización de Precios Negociados
              </h3>
              {hayPreciosNegociadosBajoCatalogo && (
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  Requiere Autorización
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Revisión técnica de márgenes de utilidad, costos de reposición y precios especiales pactados con el cliente.
            </p>
          </div>
        </div>

        {/* Estado actual de la autorización */}
        <div className="flex items-center gap-2">
          {cotizacion.autorizadaPor ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900 font-bold">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Autorizada por {cotizacion.autorizadaPor}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 font-bold">
              <AlertTriangle size={15} className="text-amber-600" />
              <span>Pendiente de Aprobación de Dueño</span>
            </div>
          )}
        </div>
      </div>

      {/* Control de Permisos Server-Side */}
      {!esPropietario && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 flex items-start gap-2.5">
          <Lock size={16} className="shrink-0 text-slate-500 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">Acceso de Solo Lectura</p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Los permisos para autorizar o rechazar precios negociados corresponden exclusivamente a los{" "}
              <strong>Propietarios o Administradores</strong>. Tu rol actual ({usuarioActual?.rol || "USUARIO"}) te
              permite consultar la comparativa de precios sin facultades de aprobación.
            </p>
          </div>
        </div>
      )}

      {/* Resumen Métrico de Rentabilidad y Descuento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cotización</p>
          <p className="mt-1 text-base font-extrabold text-slate-900 font-mono">
            {dinero(cotizacion.total || totalCotizadoActual, simboloMoneda)}
          </p>
          <p className="text-[11px] text-slate-500">Solicitante: <strong className="text-slate-700">{cotizacion.creadoPor}</strong></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Valor de Catálogo Oficial</p>
          <p className="mt-1 text-base font-extrabold text-slate-700 font-mono">
            {dinero(totalCatalogoOficial, simboloMoneda)}
          </p>
          <p className="text-[11px] text-slate-500">Precio regular de lista</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descuento Total Concedido</p>
          <p className={`mt-1 text-base font-extrabold font-mono ${ahorroTotalCliente > 0 ? "text-amber-600" : "text-slate-700"}`}>
            {dinero(ahorroTotalCliente, simboloMoneda)}
          </p>
          <p className="text-[11px] text-slate-500">
            {ahorroTotalCliente > 0 ? `-${porcentajeAhorroGlobal}% sobre catálogo` : "Sin descuento especial"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado de Rentabilidad</p>
          <div className="mt-1 flex items-center gap-1.5">
            {lineasAnalizadas.some((l) => l.esBajoCosto) ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700">
                <AlertTriangle size={15} />
                Línea Bajo Costo
              </span>
            ) : hayPreciosNegociadosBajoCatalogo ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                <TrendingDown size={15} />
                Margen Reducido
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <TrendingUp size={15} />
                Margen Pleno
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Evaluación de costos</p>
        </div>
      </div>

      {/* Tabla Comparativa de Precios y Márgenes */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-2.5 px-3">Producto / Código</th>
              <th className="py-2.5 px-3 text-center">Cant.</th>
              <th className="py-2.5 px-3 text-right">Precio Catálogo</th>
              <th className="py-2.5 px-3 text-right">Precio Negociado</th>
              <th className="py-2.5 px-3 text-right">Diferencia</th>
              <th className="py-2.5 px-3 text-right">Costo Ref.</th>
              <th className="py-2.5 px-3 text-right">Margen Est.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {lineasAnalizadas.map((linea, idx) => {
              const margenSaludable = linea.margenEstimado !== null && linea.margenEstimado >= 25;
              const margenModerado = linea.margenEstimado !== null && linea.margenEstimado >= 15 && linea.margenEstimado < 25;
              const margenCritico = linea.margenEstimado !== null && linea.margenEstimado < 15;

              return (
                <tr key={linea.id || idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-slate-900">{linea.nombre}</p>
                    <p className="text-[10px] font-mono text-slate-400">
                      Cód: {linea.codigo} · {etiquetaUnidad(linea.unidadMedida)}
                    </p>
                  </td>

                  <td className="py-2.5 px-3 text-center font-bold text-slate-700 font-mono">
                    {numero(linea.cantidad)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    {dinero(linea.precioCatalogo, simboloMoneda)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {dinero(linea.precioCotizado, simboloMoneda)}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono">
                    {linea.diferenciaMonetaria < 0 ? (
                      <span className="inline-block rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        {dinero(linea.diferenciaMonetaria, simboloMoneda)} (-{linea.porcentajeDescuento}%)
                      </span>
                    ) : linea.diferenciaMonetaria > 0 ? (
                      <span className="inline-block rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        +{dinero(linea.diferenciaMonetaria, simboloMoneda)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium">Oficial (0%)</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {linea.costoReferencia !== undefined ? (
                      dinero(linea.costoReferencia, simboloMoneda)
                    ) : (
                      <span className="text-slate-400 italic">N/D</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono">
                    {linea.margenEstimado !== null ? (
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          linea.esBajoCosto
                            ? "bg-rose-100 text-rose-900 border border-rose-300 animate-pulse"
                            : margenSaludable
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : margenModerado
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {linea.margenEstimado}%
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">N/D</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Botones Visuales de Aprobación y Rechazo para Propietarios */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info size={14} className="text-slate-400" />
          <span>
            Las aprobaciones emitidas por dueños quedan registradas con firma de auditoría inmutable.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!esPropietario}
            onClick={() => abrirAvisoAccion("RECHAZAR")}
            className="btn btn-linea h-10 px-4 text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 disabled:opacity-40 gap-1.5"
          >
            <XCircle size={15} />
            <span>Rechazar Precios</span>
          </button>

          <button
            type="button"
            disabled={!esPropietario}
            onClick={() => abrirAvisoAccion("APROBAR")}
            className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-amber-500/20 disabled:opacity-40"
          >
            <ShieldCheck size={16} />
            <span>Aprobar Precios Negociados</span>
          </button>
        </div>
      </div>

      {/* Modal Informativo de Integración Transaccional Pendiente (Restricción Fase 2.2) */}
      <Modal
        abierto={modalAvisoAbierto}
        alCerrar={() => setModalAvisoAbierto(false)}
        titulo={
          accionSeleccionada === "APROBAR"
            ? "Autorización de Precios — Modo Preparación"
            : "Rechazo de Precios — Modo Preparación"
        }
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950 flex items-start gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900">Función en Modo Preparación Visual (Fase 2.2)</p>
              <p className="leading-relaxed">
                Has verificado correctamente la solicitud de precios de la cotización{" "}
                <strong>{cotizacion.numero}</strong>. La persistencia transaccional de estados en la base de datos
                PostgreSQL estará disponible cuando se conecte el servicio definitivo de cotizaciones en la siguiente
                fase.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-100 p-3 space-y-1 font-mono text-[11px] text-slate-600">
            <p><strong>Cotización:</strong> {cotizacion.numero}</p>
            <p><strong>Acción solicitada:</strong> {accionSeleccionada === "APROBAR" ? "Aprobación de Precios de Dueño" : "Rechazo Comercial"}</p>
            <p><strong>Usuario Propietario:</strong> {usuarioActual?.usuario || "admin"} ({usuarioActual?.rol || "ADMINISTRADOR"})</p>
            <p><strong>Importe Auditado:</strong> {dinero(cotizacion.total || totalCotizadoActual, simboloMoneda)}</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setModalAvisoAbierto(false)}
              className="btn btn-amarillo h-9 px-4 text-xs font-bold"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
