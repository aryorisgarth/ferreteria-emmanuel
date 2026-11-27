"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { dinero } from "@/lib/format";
import { CamposMetodoPago } from "./CamposMetodoPago";
import type { Cliente } from "@/lib/types";
import type { FormaPagoPOS } from "./tipos";

interface ModalCobroProps {
  abierto: boolean;
  alCerrar: () => void;
  total: number;
  simboloMoneda: string;
  clientes: Cliente[];
  clienteSeleccionado: string;
  clienteIdSeleccionado: string;
  onCambiarCliente: (nombre: string, id: string) => void;
  onConfirmarCobro: (datos: {
    pago: FormaPagoPOS;
    efectivoRecibido?: number;
    bancoDestino?: string;
    referenciaBancaria?: string;
    montoEfectivoMixto?: number;
    montoTransferenciaMixto?: number;
    notasVenta?: string;
  }) => void;
  enviando?: boolean;
}

export function ModalCobro({
  abierto,
  alCerrar,
  total,
  simboloMoneda,
  clientes,
  clienteIdSeleccionado,
  onCambiarCliente,
  onConfirmarCobro,
  enviando = false,
}: ModalCobroProps) {
  const [pago, setPago] = useState<FormaPagoPOS>("EFECTIVO");
  const [efectivoRecibido, setEfectivoRecibido] = useState<number | "">("");
  const [bancoDestino, setBancoDestino] = useState("BAC Credomatic");
  const [referenciaBancaria, setReferenciaBancaria] = useState("");
  const [montoEfectivoMixto, setMontoEfectivoMixto] = useState<number | "">(() => Math.round((total / 2) * 100) / 100);
  const [montoTransferenciaMixto, setMontoTransferenciaMixto] = useState<number | "">(() => Math.round((total - Math.round((total / 2) * 100) / 100) * 100) / 100);
  const [notas, setNotas] = useState("");

  const cambio = useMemo(() => {
    if (pago === "MIXTO") {
      const ef = typeof montoEfectivoMixto === "number" ? montoEfectivoMixto : 0;
      if (typeof efectivoRecibido !== "number" || efectivoRecibido < ef) return 0;
      return Math.round((efectivoRecibido - ef) * 100) / 100;
    }
    if (typeof efectivoRecibido !== "number" || efectivoRecibido < total) return 0;
    return Math.round((efectivoRecibido - total) * 100) / 100;
  }, [pago, efectivoRecibido, total, montoEfectivoMixto]);

  const handleEfectivoMixto = (val: number | "") => {
    setMontoEfectivoMixto(val);
    if (typeof val === "number" && !isNaN(val)) {
      setMontoTransferenciaMixto(Math.max(0, Math.round((total - val) * 100) / 100));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pago === "CREDITO" && !clienteIdSeleccionado) return;
    onConfirmarCobro({
      pago,
      efectivoRecibido: typeof efectivoRecibido === "number" ? efectivoRecibido : undefined,
      bancoDestino: pago === "TRANSFERENCIA" || pago === "MIXTO" ? bancoDestino : undefined,
      referenciaBancaria: pago === "TRANSFERENCIA" || pago === "MIXTO" ? referenciaBancaria : undefined,
      montoEfectivoMixto: pago === "MIXTO" && typeof montoEfectivoMixto === "number" ? montoEfectivoMixto : undefined,
      montoTransferenciaMixto: pago === "MIXTO" && typeof montoTransferenciaMixto === "number" ? montoTransferenciaMixto : undefined,
      notasVenta: notas,
    });
  };

  const creditoBloqueado = pago === "CREDITO" && !clienteIdSeleccionado;

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Finalizar Venta y Cobro"
      subtitulo={`Total a cobrar: ${dinero(total, simboloMoneda)}`}
      anchoMax="2xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Cliente de la Venta
          </label>
          <select
            value={clienteIdSeleccionado}
            onChange={(e) => {
              const c = clientes.find((item) => item.id === e.target.value);
              onCambiarCliente(c ? c.nombre : "Público general", e.target.value);
            }}
            className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
          >
            <option value="">Público general</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.identificacion ? `(${c.identificacion})` : ""}
              </option>
            ))}
          </select>
        </div>

        <CamposMetodoPago
          pago={pago} onCambiarPago={setPago} efectivoRecibido={efectivoRecibido} onCambiarEfectivoRecibido={setEfectivoRecibido}
          bancoDestino={bancoDestino} onCambiarBancoDestino={setBancoDestino} referenciaBancaria={referenciaBancaria}
          onCambiarReferenciaBancaria={setReferenciaBancaria} montoEfectivoMixto={montoEfectivoMixto} onCambiarMontoEfectivoMixto={handleEfectivoMixto}
          montoTransferenciaMixto={montoTransferenciaMixto} onCambiarMontoTransferenciaMixto={setMontoTransferenciaMixto} cambio={cambio} simboloMoneda={simboloMoneda}
        />

        {creditoBloqueado && (
          <p className="text-[11px] font-bold text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 text-center">
            ⚠️ Para vender a crédito debe seleccionar un cliente registrado arriba.
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button type="button" onClick={alCerrar} className="btn btn-linea h-9 px-4 text-xs font-bold">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || creditoBloqueado}
            className="btn btn-amarillo h-9 px-5 text-xs font-black uppercase tracking-wider gap-1.5 shadow-sm disabled:opacity-40"
          >
            <span>Confirmar y Facturar</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
