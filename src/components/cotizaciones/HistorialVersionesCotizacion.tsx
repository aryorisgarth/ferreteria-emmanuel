"use client";

import { useState } from "react";
import Link from "next/link";
import {
  History,
  GitBranch,
  ShieldCheck,
  Calendar,
  User,
  Receipt,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { dinero, fechaCorta, numero, etiquetaUnidad } from "@/lib/format";
import type { Cotizacion, LineaComercial } from "@/lib/types";

export interface VersionCotizacionVista {
  id: string;
  numero: string;
  version: number;
  fecha: string;
  estado: string;
  esVersionActual: boolean;
  autorizadaPor?: string | null;
  autorizadaEn?: string | null;
  items: Array<LineaComercial & {
    nombre?: string;
    codigo?: string;
    cantidadFacturada?: number;
    cantidadPendiente?: number;
  }>;
  facturasAsociadas?: Array<{
    id: string;
    numero: string;
    fecha: string;
    total: number;
    estado: string;
  }>;
}

interface HistorialVersionesCotizacionProps {
  cotizacionActual: Cotizacion;
  versiones?: VersionCotizacionVista[];
  simboloMoneda?: string;
}

export function HistorialVersionesCotizacion({
  cotizacionActual,
  versiones = [],
  simboloMoneda = "C$",
}: HistorialVersionesCotizacionProps) {
  const [colapsado, setColapsado] = useState(false);

  // Si no se pasaron versiones históricas desde el backend, construimos la versión actual como V1
  const listaVersiones: VersionCotizacionVista[] =
    versiones.length > 0
      ? versiones
      : [
          {
            id: cotizacionActual.id,
            numero: cotizacionActual.numero,
            version: cotizacionActual.version || 1,
            fecha: cotizacionActual.fecha,
            estado: cotizacionActual.estado,
            esVersionActual: cotizacionActual.esVersionActual !== false,
            autorizadaPor: cotizacionActual.autorizadaPor || null,
            autorizadaEn: cotizacionActual.autorizadaEn || null,
            items: cotizacionActual.items.map((it) => ({
              ...it,
              cantidadFacturada: it.cantidadFacturada || (cotizacionActual.estado === "FACTURADA" ? it.cantidad : 0),
              cantidadPendiente:
                it.cantidadPendiente !== undefined
                  ? it.cantidadPendiente
                  : cotizacionActual.estado === "FACTURADA"
                  ? 0
                  : it.cantidad,
            })),
            facturasAsociadas: cotizacionActual.facturaId
              ? [
                  {
                    id: cotizacionActual.facturaId,
                    numero: `FAC-COT-${cotizacionActual.numero}`,
                    fecha: cotizacionActual.fecha,
                    total: cotizacionActual.total || 0,
                    estado: "EMITIDA",
                  },
                ]
              : [],
          },
        ];

  const totalVersiones = listaVersiones.length;
  const hayVersionesHistoricas = totalVersiones > 1;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* Encabezado de la Sección */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Historial de Versiones y Trazabilidad Comercial
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {totalVersiones} {totalVersiones === 1 ? "versión registrada" : "versiones"}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Control cronológico e inmutable de versiones (V1, V2, V3...) y consumo de saldos facturados.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setColapsado(!colapsado)}
          className="btn btn-linea h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 gap-1"
        >
          {colapsado ? (
            <>
              <span>Mostrar detalle</span>
              <ChevronDown size={14} />
            </>
          ) : (
            <>
              <span>Ocultar</span>
              <ChevronUp size={14} />
            </>
          )}
        </button>
      </div>

      {!colapsado && (
        <div className="space-y-4">
          {/* Alerta de Modo Solo Lectura / Inmutabilidad */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-start gap-2.5">
            <Lock size={16} className="shrink-0 text-blue-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-blue-950">Historial Inmutable de Versiones</p>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                Las versiones históricas se conservan en modo de <strong>solo lectura</strong> para garantizar la
                integridad fiscal y comercial. Ninguna factura emitida ni versión anterior puede ser alterada
                retroactivamente.
              </p>
            </div>
          </div>

          {/* Tarjetas de Versiones */}
          <div className="space-y-3">
            {listaVersiones.map((v) => {
              const esVigente = v.esVersionActual;

              return (
                <div
                  key={v.id || `v-${v.version}`}
                  className={`rounded-xl border p-4 transition-all ${
                    esVigente
                      ? "border-amber-300 bg-amber-50/30 shadow-xs"
                      : "border-slate-200 bg-slate-50/60 opacity-90"
                  }`}
                >
                  {/* Encabezado de la Versión */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-amber-300 font-mono font-black text-xs">
                        V{v.version}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {v.numero}
                      </span>
                      {esVigente ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 size={12} />
                          Versión Vigente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          <Lock size={11} />
                          Versión Sustituida (Solo Lectura)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-800 text-[10px] uppercase tracking-wider border border-slate-200">
                        Estado: {v.estado}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar size={12} />
                        Creada: {fechaCorta(v.fecha)}
                      </span>
                    </div>
                  </div>

                  {/* Metadatos de Autorización de la Versión */}
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-lg border border-slate-200/50">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className={v.autorizadaPor ? "text-emerald-600" : "text-amber-500"} />
                      <span>
                        <strong>Autorización de Dueño:</strong>{" "}
                        {v.autorizadaPor ? (
                          <span className="text-emerald-700 font-semibold">{v.autorizadaPor}</span>
                        ) : (
                          <span className="text-amber-700 italic">Pendiente de autorización formal</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:justify-end">
                      <User size={13} className="text-slate-400" />
                      <span>
                        <strong>Fecha Autorización:</strong>{" "}
                        {v.autorizadaEn ? fechaCorta(v.autorizadaEn) : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Artículos y Saldos de la Versión */}
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase">
                        <tr>
                          <th className="py-2 px-3">Producto / Código</th>
                          <th className="py-2 px-3 text-right">Cant. Cotizada</th>
                          <th className="py-2 px-3 text-right">Facturado</th>
                          <th className="py-2 px-3 text-right">Pendiente</th>
                          <th className="py-2 px-3 text-right">Precio Pactado</th>
                          <th className="py-2 px-3 text-center">Estado Línea</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {v.items.map((it, idx) => {
                          const cotizada = it.cantidad;
                          const facturada = it.cantidadFacturada || 0;
                          const pendiente = it.cantidadPendiente !== undefined ? it.cantidadPendiente : Math.max(0, cotizada - facturada);
                          const liquidada = pendiente <= 0;

                          return (
                            <tr key={it.id || idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3">
                                <p className="font-semibold text-slate-800">{it.nombre || `Producto (${it.productoId})`}</p>
                                {it.codigo && (
                                  <p className="text-[10px] font-mono text-slate-400">
                                    Cód: {it.codigo} · {etiquetaUnidad(it.unidadMedida)}
                                  </p>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
                                {numero(cotizada)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-purple-700">
                                {numero(facturada)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-amber-700">
                                {numero(pendiente)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-700">
                                {dinero(it.precio, simboloMoneda)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {liquidada ? (
                                  <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                                    Liquidada
                                  </span>
                                ) : (
                                  <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    Pendiente ({numero(pendiente)})
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Facturas Asociadas a esta Versión */}
                  <div className="mt-3 border-t border-slate-200/60 pt-2.5">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Receipt size={13} className="text-purple-600" />
                      Facturas Asociadas a esta Versión:
                    </p>
                    {v.facturasAsociadas && v.facturasAsociadas.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {v.facturasAsociadas.map((f) => (
                          <Link
                            key={f.id}
                            href={`/facturas/${f.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 px-2.5 py-1 text-xs font-semibold text-purple-900 hover:bg-purple-100 transition shadow-2xs"
                          >
                            <Receipt size={13} />
                            <span>{f.numero}</span>
                            <span className="font-mono text-[11px] text-purple-700">({dinero(f.total, simboloMoneda)})</span>
                            <span className="text-[10px] text-purple-500">· {fechaCorta(f.fecha)}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No hay facturas emitidas contra esta versión hasta el momento.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estado Informativo de Versión Inicial */}
          {!hayVersionesHistoricas && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 text-center">
              <p className="font-semibold text-slate-700">
                Esta cotización se encuentra en su versión inicial (V1).
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                No existen versiones sustituidas previas. Las modificaciones futuras sobre saldos pendientes generarán
                V2 conservando este registro histórico de forma inmutable.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
