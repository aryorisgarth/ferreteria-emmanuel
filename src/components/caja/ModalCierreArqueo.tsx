"use client";

import { Modal } from "@/components/ui/Modal";
import { dinero } from "@/lib/format";
import { cerrarTurnoCajaAction } from "@/app/actions";
import type { TurnoCaja } from "@/lib/types";

interface ModalCierreArqueoProps {
  abierto: boolean;
  alCerrar: () => void;
  turno: TurnoCaja | null;
  efectivoContado: number | "";
  onCambiarEfectivoContado: (val: number | "") => void;
  notasCierre: string;
  onCambiarNotasCierre: (val: string) => void;
  efectivoEsperado: number;
  diferenciaArqueo: number | null;
  simboloMoneda: string;
}

export function ModalCierreArqueo({
  abierto,
  alCerrar,
  turno,
  efectivoContado,
  onCambiarEfectivoContado,
  notasCierre,
  onCambiarNotasCierre,
  efectivoEsperado,
  diferenciaArqueo,
  simboloMoneda,
}: ModalCierreArqueoProps) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={`Cierre y Arqueo — Caja ${turno?.numero || ""}`}
      subtitulo="Conteo físico de efectivo y verificación de diferencias de gaveta."
      anchoMax="xl"
    >
      <form action={cerrarTurnoCajaAction} className="space-y-4">
        <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block">Efectivo Esperado:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{dinero(efectivoEsperado, simboloMoneda)}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Diferencia:</span>
            <span className={`font-mono font-bold text-sm ${diferenciaArqueo !== null && diferenciaArqueo < 0 ? "text-rose-600" : "text-emerald-700"}`}>
              {diferenciaArqueo !== null ? dinero(diferenciaArqueo, simboloMoneda) : "—"}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Efectivo Real Contado en Gaveta *
          </label>
          <input
            type="number"
            name="montoReal"
            step="any"
            min="0"
            required
            value={efectivoContado}
            onChange={(e) => onCambiarEfectivoContado(parseFloat(e.target.value) || "")}
            placeholder="0.00"
            className="h-10 w-full rounded border border-slate-300 bg-white px-3 font-mono font-bold text-slate-900 outline-none focus:border-brand-yellow"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Notas de Cierre</label>
          <input
            type="text"
            name="notas"
            value={notasCierre}
            onChange={(e) => onCambiarNotasCierre(e.target.value)}
            placeholder="Observaciones de cierre..."
            className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-xs outline-none focus:border-brand-yellow"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={alCerrar} className="btn btn-linea h-9 px-3 text-xs font-bold">
            Cancelar
          </button>
          <button type="submit" className="btn btn-azul h-9 px-5 text-xs font-black uppercase tracking-wider shadow-xs">
            Confirmar Cierre de Caja
          </button>
        </div>
      </form>
    </Modal>
  );
}
