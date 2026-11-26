"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { crearConteoFisicoAction } from "@/app/actions";
import type { LineaNuevoConteo } from "./tipos";
import { TablaLineasNuevoConteo } from "./TablaLineasNuevoConteo";

interface ModalNuevoConteoProps {
  abierto: boolean;
  alCerrar: () => void;
  conteoFecha: string;
  setConteoFecha: (f: string) => void;
  conteoNotas: string;
  setConteoNotas: (n: string) => void;
  conteoLineas: LineaNuevoConteo[];
  setConteoLineas: React.Dispatch<React.SetStateAction<LineaNuevoConteo[]>>;
}

export function ModalNuevoConteo({
  abierto,
  alCerrar,
  conteoFecha,
  setConteoFecha,
  conteoNotas,
  setConteoNotas,
  conteoLineas,
  setConteoLineas,
}: ModalNuevoConteoProps) {
  const { toast } = useToast();
  const [enviando, setEnviando] = useState(false);

  const cambiarConteo = (idx: number, valor: number) => {
    setConteoLineas((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, conteoFisico: valor } : item))
    );
  };

  const cambiarObservacion = (idx: number, texto: string) => {
    setConteoLineas((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, observacion: texto } : item))
    );
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Nuevo Levantamiento de Conteo Físico"
      subtitulo="Capture los valores contados en estantes. Guardar registrará un borrador sin alterar existencias hasta su aplicación formal."
      anchoMax="4xl"
    >
      <form
        action={async (formData) => {
          setEnviando(true);
          try {
            const payload = conteoLineas.map((l) => ({
              productoId: l.productoId,
              conteoFisico: Number(l.conteoFisico),
              observacion: l.observacion?.trim() || undefined,
            }));
            formData.set("items", JSON.stringify(payload));
            await crearConteoFisicoAction(formData);
            toast.exito("Borrador de conteo físico guardado exitosamente.");
            alCerrar();
          } catch (err: any) {
            toast.error(err?.message || "Ocurrió un error al guardar el conteo.", "Error de Conteo");
          } finally {
            setEnviando(false);
          }
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Fecha del Levantamiento
            </label>
            <input
              type="date"
              name="fecha"
              value={conteoFecha}
              onChange={(e) => setConteoFecha(e.target.value)}
              required
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-brand-yellow"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Notas / Área Auditada
            </label>
            <input
              type="text"
              name="notas"
              value={conteoNotas}
              onChange={(e) => setConteoNotas(e.target.value)}
              placeholder="Ej. Auditoría de pasillo de herramientas..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-yellow"
            />
          </div>
        </div>

        <TablaLineasNuevoConteo
          conteoLineas={conteoLineas}
          onCambioConteo={cambiarConteo}
          onCambioObservacion={cambiarObservacion}
        />

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Total Artículos: <strong className="text-slate-800">{conteoLineas.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={alCerrar}
              className="h-10 rounded-lg px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || conteoLineas.length === 0}
              className="btn btn-amarillo h-10 px-5 text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {enviando ? "Guardando..." : "Guardar Borrador de Conteo"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
