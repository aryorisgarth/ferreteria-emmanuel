"use client";

import { Clock, Play, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { dinero, numero } from "@/lib/format";
import type { TicketEnEspera } from "./useTicketsEnEspera";

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  tickets: TicketEnEspera[];
  simboloMoneda: string;
  onRetomar: (id: string) => void;
  onDescartar: (id: string) => void;
}

export function ModalTicketsEspera({
  abierto,
  alCerrar,
  tickets,
  simboloMoneda,
  onRetomar,
  onDescartar,
}: Props) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Tickets de Venta en Espera"
      subtitulo="Retoma ventas pausadas para no trabar la fila de atención en caja"
      anchoMax="lg"
    >
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <Clock size={32} className="mx-auto opacity-30 text-slate-400" />
            <p className="text-xs font-medium">No hay tickets pausados en este terminal.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto">
            {tickets.map((t, idx) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center border border-amber-200/70 shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black font-mono text-slate-900">
                        {dinero(t.total, simboloMoneda)}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        · {t.fechaHora}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {numero(t.articulosCount)} artículos en espera
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onRetomar(t.id);
                      alCerrar();
                    }}
                    className="btn btn-amarillo h-8 px-3 text-xs font-bold gap-1 shadow-2xs cursor-pointer"
                    title="Cargar al carrito"
                  >
                    <Play size={12} className="fill-current" />
                    <span>Retomar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDescartar(t.id)}
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                    title="Descartar ticket"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={alCerrar}
            className="btn btn-linea h-8 px-3 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
