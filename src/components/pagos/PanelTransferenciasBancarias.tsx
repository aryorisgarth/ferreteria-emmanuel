"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  ExternalLink,
  DollarSign,
  ArrowRight,
  Info,
  Lock,
} from "lucide-react";
import { dinero, fechaCorta, numero } from "@/lib/format";
import type { EstadoTransferenciaBancaria, TransferenciaBancaria } from "@/lib/domain/pagos/types";
import { Modal } from "@/components/ui/Modal";
import { verificarTransferenciaAction, rechazarTransferenciaAction } from "@/app/actions";

export interface ItemTransferenciaVista extends TransferenciaBancaria {
  clienteNombre?: string;
  facturaNumero?: string;
  facturaId?: string;
}

interface PanelTransferenciasBancariasProps {
  transferencias: ItemTransferenciaVista[];
  simboloMoneda?: string;
  esPropietario: boolean;
  usuarioActual?: {
    usuario: string;
    nombre: string;
    rol: string;
  } | null;
}

export function PanelTransferenciasBancarias({
  transferencias = [],
  simboloMoneda = "C$",
  esPropietario,
  usuarioActual,
}: PanelTransferenciasBancariasProps) {
  const [q, setQ] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODAS");
  const [filtroBanco, setFiltroBanco] = useState<string>("TODOS");

  // Modal para ver comprobante / voucher
  const [modalComprobanteAbierto, setModalComprobanteAbierto] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<{
    referencia: string;
    url: string;
    banco?: string;
    monto: number;
    cliente?: string;
  } | null>(null);

  // Modal de acción (Verificar / Rechazar)
  const [modalAccionAbierto, setModalAccionAbierto] = useState(false);
  const [transferenciaAccion, setTransferenciaAccion] = useState<ItemTransferenciaVista | null>(null);
  const [tipoAccion, setTipoAccion] = useState<"VERIFICAR" | "RECHAZAR" | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  // Filtrado de transferencias
  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return transferencias.filter((tr) => {
      const matchTexto =
        !t ||
        tr.referenciaBancaria.toLowerCase().includes(t) ||
        (tr.clienteNombre && tr.clienteNombre.toLowerCase().includes(t)) ||
        (tr.facturaNumero && tr.facturaNumero.toLowerCase().includes(t)) ||
        (tr.bancoDestino && tr.bancoDestino.toLowerCase().includes(t));

      const matchEstado = filtroEstado === "TODAS" || tr.estado === filtroEstado;
      const matchBanco = filtroBanco === "TODOS" || tr.bancoDestino === filtroBanco;

      return matchTexto && matchEstado && matchBanco;
    });
  }, [transferencias, q, filtroEstado, filtroBanco]);

  // Lista de bancos únicos presentes
  const bancosDisponibles = useMemo(() => {
    const setBancos = new Set<string>();
    transferencias.forEach((t) => {
      if (t.bancoDestino) setBancos.add(t.bancoDestino);
    });
    return Array.from(setBancos);
  }, [transferencias]);

  // Métricas
  const totalMontoPendiente = useMemo(() => {
    return transferencias
      .filter((t) => t.estado === "PENDIENTE_VERIFICACION")
      .reduce((acc, t) => acc + (t.monto || 0), 0);
  }, [transferencias]);

  const totalMontoVerificado = useMemo(() => {
    return transferencias
      .filter((t) => t.estado === "VERIFICADA")
      .reduce((acc, t) => acc + (t.monto || 0), 0);
  }, [transferencias]);

  function abrirModalComprobante(tr: ItemTransferenciaVista) {
    setComprobanteSeleccionado({
      referencia: tr.referenciaBancaria,
      url: tr.comprobanteUrl,
      banco: tr.bancoDestino,
      monto: tr.monto,
      cliente: tr.clienteNombre,
    });
    setModalComprobanteAbierto(true);
  }

  function iniciarAccion(tr: ItemTransferenciaVista, tipo: "VERIFICAR" | "RECHAZAR") {
    setTransferenciaAccion(tr);
    setTipoAccion(tipo);
    setMotivoRechazo("");
    setModalAccionAbierto(true);
  }

  return (
    <div className="space-y-4">
      {/* 1. Métricas Rápidas de Transferencias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              Pendientes de Verificación
            </span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="mt-1 font-mono text-xl font-black text-amber-950">
            {dinero(totalMontoPendiente, simboloMoneda)}
          </p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            {transferencias.filter((t) => t.estado === "PENDIENTE_VERIFICACION").length} transacciones por auditar
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
              Verificadas y Acreditadas
            </span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="mt-1 font-mono text-xl font-black text-emerald-950">
            {dinero(totalMontoVerificado, simboloMoneda)}
          </p>
          <p className="text-[11px] text-emerald-800 mt-0.5">
            {transferencias.filter((t) => t.estado === "VERIFICADA").length} transacciones liquidadas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rechazadas / Inválidas
            </span>
            <XCircle size={16} className="text-rose-500" />
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-800">
            {transferencias.filter((t) => t.estado === "RECHAZADA").length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Operaciones con inconsistencia bancaria
          </p>
        </div>
      </div>

      {/* 2. Banner de Regla de Negocio y Control de Permisos */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950 space-y-1">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <Info size={16} className="text-blue-600 shrink-0" />
          <span>Regla de Seguridad Financiera — Transferencias Bancarias</span>
        </div>
        <p className="text-blue-800 leading-relaxed text-[11px]">
          Toda transferencia ingresada en el punto de venta o cobro de mostrador permanece en estado{" "}
          <strong>PENDIENTE_VERIFICACION</strong>. Un comprobante o voucher digital <strong>NO</strong> acredita
          la cancelación de la deuda ni el despacho de mercadería hasta que uno de los <strong>propietarios</strong>{" "}
          confirme el crédito real en la cuenta bancaria de la ferretería.
        </p>
        {!esPropietario && (
          <p className="mt-1 font-bold text-amber-800 text-[11px] flex items-center gap-1">
            <Lock size={13} className="text-amber-600" />
            Acceso de Solo Lectura: Tu rol actual ({usuarioActual?.rol || "USUARIO"}) te permite consultar los
            comprobantes pero no autorizar ni rechazar transferencias.
          </p>
        )}
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por No. de referencia bancaria, cliente o factura..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs font-medium text-slate-800 outline-none transition focus:border-brand-yellow focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-yellow"
              >
                <option value="TODAS">Todos los Estados</option>
                <option value="PENDIENTE_VERIFICACION">Pendientes de Verificación</option>
                <option value="VERIFICADA">Verificadas</option>
                <option value="RECHAZADA">Rechazadas</option>
              </select>
            </div>

            {bancosDisponibles.length > 0 && (
              <select
                value={filtroBanco}
                onChange={(e) => setFiltroBanco(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-yellow"
              >
                <option value="TODOS">Todos los Bancos</option>
                {bancosDisponibles.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* 4. Listado / Tabla de Transferencias */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt size={17} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Registro de Transferencias Bancarias
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filtradas.length} transferencia{filtradas.length === 1 ? "" : "s"}
          </span>
        </div>

        {filtradas.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">No se encontraron transferencias</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              No existen transacciones bancarias que coincidan con los filtros aplicados. Las transferencias registradas
              en el POS aparecerán aquí para revisión.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Referencia / Banco</th>
                  <th className="py-2.5 px-3">Cliente / Operación</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                  <th className="py-2.5 px-3">Fecha / Registrado Por</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-center">Comprobante</th>
                  <th className="py-2.5 px-3 text-right">Acciones Propietario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtradas.map((tr) => {
                  const esPendiente = tr.estado === "PENDIENTE_VERIFICACION";
                  const esVerificada = tr.estado === "VERIFICADA";
                  const esRechazada = tr.estado === "RECHAZADA";

                  return (
                    <tr key={tr.id || tr.referenciaBancaria} className="hover:bg-slate-50/60">
                      {/* Referencia y Banco */}
                      <td className="py-2.5 px-3 font-mono">
                        <p className="font-bold text-slate-900">{tr.referenciaBancaria}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-sans">
                          {tr.bancoDestino || "Banco General"}
                        </p>
                      </td>

                      {/* Cliente y Factura Relacionada */}
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-800">{tr.clienteNombre || "Cliente Mostrador"}</p>
                        {tr.facturaNumero && (
                          <Link
                            href={tr.facturaId ? `/facturas/${tr.facturaId}` : `/facturas`}
                            className="text-[11px] text-blue-600 hover:underline font-mono inline-flex items-center gap-1"
                          >
                            <span>{tr.facturaNumero}</span>
                            <ExternalLink size={10} />
                          </Link>
                        )}
                      </td>

                      {/* Monto */}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                        {dinero(tr.monto, simboloMoneda)}
                      </td>

                      {/* Fecha y Registrado por */}
                      <td className="py-2.5 px-3">
                        <p className="text-slate-700 font-semibold">{fechaCorta(tr.creadoEn)}</p>
                        <p className="text-[10px] text-slate-400">Por: {tr.creadoPor}</p>
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-3 text-center">
                        {esPendiente ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                            <Clock size={11} />
                            Pendiente
                          </span>
                        ) : esVerificada ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
                              <CheckCircle2 size={11} />
                              Verificada
                            </span>
                            {tr.verificadoPor && (
                              <p className="text-[9px] text-slate-400 font-mono">Por: {tr.verificadoPor}</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-bold text-rose-900">
                              <XCircle size={11} />
                              Rechazada
                            </span>
                            {tr.motivoRechazo && (
                              <p className="text-[9px] text-rose-600 italic max-w-[120px] truncate" title={tr.motivoRechazo}>
                                {tr.motivoRechazo}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Comprobante */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => abrirModalComprobante(tr)}
                          className="btn btn-linea h-7 px-2.5 text-[11px] font-bold text-slate-700 hover:text-slate-900 gap-1"
                        >
                          <Eye size={12} />
                          <span>Ver Voucher</span>
                        </button>
                      </td>

                      {/* Acciones para Propietarios */}
                      <td className="py-2.5 px-3 text-right">
                        {esPendiente ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={!esPropietario}
                              onClick={() => iniciarAccion(tr, "RECHAZAR")}
                              className="btn btn-linea h-7 px-2 text-[10px] font-bold text-rose-700 border-rose-200 hover:bg-rose-50 disabled:opacity-40"
                              title="Rechazar transferencia inválida"
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              disabled={!esPropietario}
                              onClick={() => iniciarAccion(tr, "VERIFICAR")}
                              className="btn btn-amarillo h-7 px-2.5 text-[10px] font-bold gap-1 shadow-2xs disabled:opacity-40"
                              title="Verificar y acreditar fondos"
                            >
                              <ShieldCheck size={12} />
                              <span>Verificar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Operación cerrada
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal de Vista Previa del Comprobante / Voucher Digital */}
      <Modal
        abierto={modalComprobanteAbierto}
        alCerrar={() => setModalComprobanteAbierto(false)}
        titulo="Comprobante Digital de Transferencia"
      >
        {comprobanteSeleccionado && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Referencia Bancaria:</span>
                <strong className="text-slate-900">{comprobanteSeleccionado.referencia}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Banco:</span>
                <strong className="text-slate-900">{comprobanteSeleccionado.banco || "General"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto Acreditado:</span>
                <strong className="text-emerald-700 font-extrabold text-sm">{dinero(comprobanteSeleccionado.monto, simboloMoneda)}</strong>
              </div>
              {comprobanteSeleccionado.cliente && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <strong className="text-slate-900">{comprobanteSeleccionado.cliente}</strong>
                </div>
              )}
            </div>

            {/* Simulación visual del voucher */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100/70 p-4 text-center space-y-2">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Receipt size={24} />
              </div>
              <p className="font-bold text-slate-800">Comprobante Digital Almacenado</p>
              <p className="text-[10px] font-mono text-slate-500 break-all px-2">
                {comprobanteSeleccionado.url}
              </p>
              <div className="pt-2">
                <a
                  href={comprobanteSeleccionado.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-linea h-8 px-3 text-xs font-bold gap-1 mx-auto inline-flex"
                >
                  <ExternalLink size={12} />
                  <span>Abrir Archivo en Pestaña Segura</span>
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setModalComprobanteAbierto(false)}
                className="btn btn-amarillo h-9 px-4 text-xs font-bold"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. Modal de Confirmación de Acción (Verificar / Rechazar) — Política A */}
      <Modal
        abierto={modalAccionAbierto}
        alCerrar={() => setModalAccionAbierto(false)}
        titulo={tipoAccion === "VERIFICAR" ? "Confirmar Verificación Bancaria" : "Rechazar Transferencia"}
      >
        {transferenciaAccion && (
          <form
            action={tipoAccion === "VERIFICAR" ? verificarTransferenciaAction : rechazarTransferenciaAction}
            className="space-y-4 text-xs text-slate-700"
          >
            <input type="hidden" name="id" value={transferenciaAccion.id} />
            <div className={`rounded-xl border p-3.5 flex items-start gap-2.5 ${
              tipoAccion === "VERIFICAR" ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-rose-300 bg-rose-50 text-rose-950"
            }`}>
              {tipoAccion === "VERIFICAR" ? (
                <ShieldCheck size={18} className="shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">
                  {tipoAccion === "VERIFICAR" ? "Autorización de Propietario: Acreditación Bancaria" : "Rechazo de Transferencia por Inconsistencia"}
                </p>
                <p className="leading-relaxed text-[11px]">
                  {tipoAccion === "VERIFICAR"
                    ? `Al confirmar, se certifica que la referencia '${transferenciaAccion.referenciaBancaria}' por ${dinero(transferenciaAccion.monto, simboloMoneda)} ha sido acreditada efectivamente en la cuenta de la ferretería. La factura quedará liquidada.`
                    : `Estás a punto de marcar como rechazada la transferencia '${transferenciaAccion.referenciaBancaria}'.`}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-100 p-3 space-y-1 font-mono text-[11px]">
              <p><strong>Referencia:</strong> {transferenciaAccion.referenciaBancaria}</p>
              <p><strong>Monto Auditado:</strong> {dinero(transferenciaAccion.monto, simboloMoneda)}</p>
              <p><strong>Propietario Verificador:</strong> {usuarioActual?.usuario || "admin"} ({usuarioActual?.rol || "ADMINISTRADOR"})</p>
            </div>

            {tipoAccion === "RECHAZAR" && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Motivo o Justificación del Rechazo
                </label>
                <input
                  type="text"
                  name="motivo"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  required
                  placeholder="Ej. No figura en estado de cuenta BAC, voucher ilegible..."
                  className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none focus:border-brand-yellow"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAccionAbierto(false)}
                className="btn btn-linea h-9 px-4 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={tipoAccion === "VERIFICAR" ? "btn btn-amarillo h-9 px-4 text-xs font-bold" : "btn btn-rojo h-9 px-4 text-xs font-bold"}
              >
                {tipoAccion === "VERIFICAR" ? "Confirmar y Acreditar Factura" : "Confirmar Rechazo"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
