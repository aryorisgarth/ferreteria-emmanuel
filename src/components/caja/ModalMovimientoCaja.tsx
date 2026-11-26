"use client";

import { Modal } from "@/components/ui/Modal";
import { registrarMovimientoCajaAction } from "@/app/actions";

interface ModalMovimientoCajaProps {
  abierto: boolean;
  alCerrar: () => void;
  simboloMoneda: string;
}

export function ModalMovimientoCaja({ abierto, alCerrar, simboloMoneda }: ModalMovimientoCajaProps) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Movimiento de Caja Menor"
      subtitulo="Registra ingresos o egresos no comerciales durante el turno."
    >
      <form action={registrarMovimientoCajaAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Tipo</label>
            <select name="tipo" className="h-9 w-full rounded border border-slate-300 bg-white px-2 text-xs font-bold outline-none focus:border-brand-yellow">
              <option value="EGRESO">Salida / Gasto Menor</option>
              <option value="INGRESO">Ingreso Extra</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Monto ({simboloMoneda})</label>
            <input type="number" name="monto" step="any" min="0.01" required placeholder="0.00" className="h-9 w-full rounded border border-slate-300 bg-white px-2.5 font-mono font-bold text-xs outline-none focus:border-brand-yellow" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Concepto / Motivo</label>
          <input type="text" name="concepto" required placeholder="Ej. Pago de flete, compra de cinta adhesiva..." className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-xs outline-none focus:border-brand-yellow" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={alCerrar} className="btn btn-linea h-9 px-3 text-xs font-bold">
            Cancelar
          </button>
          <button type="submit" className="btn btn-amarillo h-9 px-4 text-xs font-bold shadow-xs">
            Registrar Movimiento
          </button>
        </div>
      </form>
    </Modal>
  );
}
