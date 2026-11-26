"use client";

import { Modal } from "@/components/ui/Modal";
import { abrirTurnoCajaAction } from "@/app/actions";

interface ModalAbrirTurnoProps {
  abierto: boolean;
  alCerrar: () => void;
  simboloMoneda: string;
}

export function ModalAbrirTurno({ abierto, alCerrar, simboloMoneda }: ModalAbrirTurnoProps) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Abrir Nuevo Turno de Caja"
      subtitulo="Ingresa el fondo inicial de gaveta para comenzar las operaciones de venta."
    >
      <form action={abrirTurnoCajaAction} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Fondo Inicial en Gaveta ({simboloMoneda})
          </label>
          <input
            type="number"
            name="montoInicial"
            step="any"
            min="0"
            required
            placeholder="Ej. 1500"
            className="h-10 w-full rounded border border-slate-300 bg-white px-3 font-mono font-bold text-slate-900 outline-none focus:border-brand-yellow"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Observaciones de Apertura
          </label>
          <input
            type="text"
            name="notas"
            placeholder="Ej. Billetes de 100 y monedas para cambio"
            className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-xs outline-none focus:border-brand-yellow"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={alCerrar} className="btn btn-linea h-9 px-3 text-xs font-bold">
            Cancelar
          </button>
          <button type="submit" className="btn btn-amarillo h-9 px-5 text-xs font-black uppercase tracking-wider shadow-xs">
            Abrir Turno
          </button>
        </div>
      </form>
    </Modal>
  );
}
