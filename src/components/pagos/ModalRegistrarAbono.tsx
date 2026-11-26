"use client";

import { useState, useMemo } from "react";
import {
  Banknote,
  Receipt,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  User,
  DollarSign,
  Calendar,
  Building2,
  FileCheck,
  Printer,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { dinero, numero, fechaCorta } from "@/lib/format";
import type { TurnoCaja } from "@/lib/types";
import { imprimirReciboAbonoCaja } from "./utilidades-recibo-abono";

export interface FacturaParaAbono {
  id: string;
  numero: string;
  cliente: string;
  clienteId?: string | null;
  total: number;
  saldoPendiente: number;
  abonosPrevios?: number;
  fecha?: string;
}

interface ModalRegistrarAbonoProps {
  abierto: boolean;
  alCerrar: () => void;
  factura: FacturaParaAbono | null;
  simboloMoneda?: string;
  turnoActivo: TurnoCaja | null;
  esPropietario: boolean;
  usuarioActual?: {
    usuario: string;
    nombre: string;
    rol: string;
  } | null;
  alConfirmarDemostracion?: (datos: any) => void;
}

export function ModalRegistrarAbono({
  abierto,
  alCerrar,
  factura,
  simboloMoneda = "C$",
  turnoActivo,
  esPropietario,
  usuarioActual,
  alConfirmarDemostracion,
}: ModalRegistrarAbonoProps) {
  const [montoAbono, setMontoAbono] = useState<number | "">("");
  const [medioCobro, setMedioCobro] = useState<"EFECTIVO" | "TRANSFERENCIA">("EFECTIVO");
  const [referenciaBancaria, setReferenciaBancaria] = useState("");
  const [bancoDestino, setBancoDestino] = useState("BAC Credomatic");
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [notas, setNotas] = useState("");
  const [modalExitoDemostracion, setModalExitoDemostracion] = useState(false);

  // Cálculos en tiempo real
  const saldoActual = factura?.saldoPendiente || 0;
  const totalOriginal = factura?.total || 0;
  const abonosAcumulados = factura?.abonosPrevios || Math.max(0, totalOriginal - saldoActual);

  const montoNum = typeof montoAbono === "number" ? montoAbono : 0;
  const montoValido = montoNum > 0 && montoNum <= saldoActual;
  const saldoRestante = Math.max(0, Math.round((saldoActual - montoNum + Number.EPSILON) * 100) / 100);
  const quedaraLiquidada = montoValido && saldoRestante === 0;

  // Validaciones
  const errorMonto =
    montoNum <= 0 && montoAbono !== ""
      ? "El monto del abono debe ser mayor a cero."
      : montoNum > saldoActual
      ? `El abono (C$ ${montoNum}) supera el saldo pendiente de la factura (C$ ${saldoActual}).`
      : null;

  const sinTurnoCaja = medioCobro === "EFECTIVO" && !turnoActivo;
  const transferenciaIncompleta =
    medioCobro === "TRANSFERENCIA" && (!referenciaBancaria.trim() || !comprobanteUrl.trim());

  const puedeRegistrar =
    esPropietario &&
    montoValido &&
    !errorMonto &&
    !sinTurnoCaja &&
    !transferenciaIncompleta;

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!puedeRegistrar) return;

    setModalExitoDemostracion(true);
    if (alConfirmarDemostracion) {
      alConfirmarDemostracion({
        facturaId: factura?.id,
        monto: montoNum,
        medioCobro,
        referenciaBancaria,
        bancoDestino,
        comprobanteUrl,
        saldoRestante,
      });
    }
  }

  function cerrarTodo() {
    setModalExitoDemostracion(false);
    setMontoAbono("");
    setReferenciaBancaria("");
    setComprobanteUrl("");
    setNotas("");
    alCerrar();
  }

  if (!factura) return null;

  return (
    <>
      <Modal
        abierto={abierto}
        alCerrar={alCerrar}
        titulo={`Registrar Abono a Factura ${factura.numero}`}
        anchoMax="2xl"
      >
        <form onSubmit={manejarEnvio} className="space-y-4 text-xs text-slate-700">
          {/* Ficha Resumen de la Factura y Saldo */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente Deudor</span>
                <p className="text-sm font-bold text-slate-900">{factura.cliente}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Folio Factura</span>
                <p className="font-mono text-xs font-bold text-slate-800">{factura.numero}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Importe Original</span>
                <span className="font-extrabold text-slate-700">{dinero(totalOriginal, simboloMoneda)}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Abonos Previos</span>
                <span className="font-extrabold text-purple-700">{dinero(abonosAcumulados, simboloMoneda)}</span>
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-2">
                <span className="text-[9px] uppercase font-bold text-amber-900 block font-sans">Saldo Pendiente</span>
                <span className="font-black text-amber-700 text-sm">{dinero(saldoActual, simboloMoneda)}</span>
              </div>
            </div>
          </div>

          {/* Control de Permisos Server-Side */}
          {!esPropietario && (
            <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs text-slate-600 flex items-start gap-2">
              <Lock size={15} className="text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-800">Permisos Restringidos a Propietarios</p>
                <p className="text-[11px] text-slate-600">
                  Solo los <strong>propietarios o administradores</strong> tienen facultades para registrar abonos y
                  liquidar cuentas por cobrar de clientes.
                </p>
              </div>
            </div>
          )}

          {/* Monto del Nuevo Abono */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Monto del Nuevo Abono
              </label>
              <button
                type="button"
                onClick={() => setMontoAbono(saldoActual)}
                className="text-[11px] font-bold text-amber-600 hover:underline"
              >
                Liquidar Totalidad ({dinero(saldoActual, simboloMoneda)})
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                {simboloMoneda}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                max={saldoActual}
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value ? Number(e.target.value) : "")}
                placeholder="0.00"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 font-mono text-sm font-bold text-slate-900 outline-none focus:border-brand-yellow"
              />
            </div>

            {errorMonto && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle size={13} />
                {errorMonto}
              </p>
            )}
          </div>

          {/* Selector de Medio de Cobro: EFECTIVO o TRANSFERENCIA (CREDITO excluido por regla) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Medio de Cobro del Abono
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMedioCobro("EFECTIVO")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                  medioCobro === "EFECTIVO"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote size={15} />
                <span>Efectivo (Caja)</span>
              </button>

              <button
                type="button"
                onClick={() => setMedioCobro("TRANSFERENCIA")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                  medioCobro === "TRANSFERENCIA"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Receipt size={15} />
                <span>Transferencia Bancaria</span>
              </button>
            </div>
          </div>

          {/* Campos específicos si es EFECTIVO */}
          {medioCobro === "EFECTIVO" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Turno de Caja Requerido:</span>
                {turnoActivo ? (
                  <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Turno Abierto (Caja Principal)
                  </span>
                ) : (
                  <span className="font-bold text-rose-600 flex items-center gap-1">
                    <AlertTriangle size={13} />
                    Sin Turno Abierto
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                El cobro en efectivo generará automáticamente un movimiento de ingreso en el turno de caja activo.
              </p>
            </div>
          )}

          {/* Campos específicos si es TRANSFERENCIA */}
          {medioCobro === "TRANSFERENCIA" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2.5">
              <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} />
                Datos de la Transferencia Bancaria
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Banco Destino
                  </label>
                  <select
                    value={bancoDestino}
                    onChange={(e) => setBancoDestino(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="BAC Credomatic">BAC Credomatic</option>
                    <option value="Banco LAFISE">Banco LAFISE</option>
                    <option value="Banpro">Banpro Promerica</option>
                    <option value="BDF">BDF</option>
                    <option value="Ficohsa">Ficohsa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    No. Referencia Bancaria *
                  </label>
                  <input
                    type="text"
                    value={referenciaBancaria}
                    onChange={(e) => setReferenciaBancaria(e.target.value)}
                    placeholder="Ej. BAC #894210"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Comprobante Digital / Voucher (URL o Archivo) *
                </label>
                <input
                  type="text"
                  value={comprobanteUrl}
                  onChange={(e) => setComprobanteUrl(e.target.value)}
                  placeholder="https://comprobantes.ferreteria/voucher-894210.jpg"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-mono text-slate-700 outline-none"
                />
                <p className="text-[10px] text-amber-800 mt-1">
                  ⚠ El abono por transferencia permanecerá en estado PENDIENTE hasta ser verificado en la cuenta bancaria.
                </p>
              </div>
            </div>
          )}

          {/* Proyección del Remanente */}
          {montoValido && (
            <div className={`rounded-xl border p-3 flex items-center justify-between font-mono text-xs ${
              quedaraLiquidada ? "border-emerald-300 bg-emerald-50 text-emerald-950 font-bold" : "border-slate-200 bg-slate-50 text-slate-800"
            }`}>
              <span>Nuevo Saldo Pendiente de la Factura:</span>
              <div className="text-right">
                <span className="text-base font-extrabold">{dinero(saldoRestante, simboloMoneda)}</span>
                {quedaraLiquidada && (
                  <p className="text-[10px] text-emerald-700 font-sans uppercase tracking-wider font-bold">
                    ✓ Factura Totalmente Liquidada
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Botones del Formulario */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={alCerrar}
              className="btn btn-linea h-10 px-4 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeRegistrar}
              className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-amber-500/20 disabled:opacity-40"
            >
              <FileCheck size={15} />
              <span>Registrar Abono a Cartera</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmación y Recibo Oficial */}
      <Modal
        abierto={modalExitoDemostracion}
        alCerrar={cerrarTodo}
        titulo="Abono Registrado — Recibo Oficial de Caja"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-emerald-950 flex items-start gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-900">Abono Registrado y Aplicado con Éxito</p>
              <p className="leading-relaxed text-[11px]">
                El abono por <strong>{dinero(montoNum, simboloMoneda)}</strong> a la factura{" "}
                <strong>{factura.numero}</strong> fue asentado formalmente. Puede generar e imprimir el recibo oficial de caja para entregar al cliente.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-100 p-3 space-y-1 font-mono text-[11px]">
            <p><strong>Cliente:</strong> {factura.cliente}</p>
            <p><strong>Factura:</strong> {factura.numero}</p>
            <p><strong>Monto Abonado:</strong> {dinero(montoNum, simboloMoneda)}</p>
            <p><strong>Medio de Cobro:</strong> {medioCobro}</p>
            {medioCobro === "TRANSFERENCIA" && (
              <p><strong>Referencia:</strong> {referenciaBancaria} ({bancoDestino})</p>
            )}
            <p><strong>Nuevo Saldo Pendiente:</strong> {dinero(saldoRestante, simboloMoneda)}</p>
            <p><strong>Registrado por:</strong> {usuarioActual?.usuario || "admin"} ({usuarioActual?.rol || "ADMINISTRADOR"})</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                imprimirReciboAbonoCaja({
                  reciboNumero: `REC-${Date.now().toString().slice(-6)}`,
                  facturaNumero: factura.numero,
                  cliente: factura.cliente,
                  fecha: new Date().toLocaleDateString("es-NI"),
                  hora: new Date().toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" }),
                  montoAbonado: montoNum,
                  saldoAnterior: saldoActual,
                  saldoRestante: saldoRestante,
                  medioCobro: medioCobro,
                  referencia: medioCobro === "TRANSFERENCIA" ? `${bancoDestino} #${referenciaBancaria}` : undefined,
                  usuario: usuarioActual?.nombre || usuarioActual?.usuario || "Cajero Principal",
                  notas: notas || undefined,
                });
              }}
              className="btn btn-azul h-9 px-4 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <Printer size={15} />
              <span>Imprimir Recibo de Caja</span>
            </button>
            <button
              type="button"
              onClick={cerrarTodo}
              className="btn btn-amarillo h-9 px-4 text-xs font-bold"
            >
              Finalizar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
