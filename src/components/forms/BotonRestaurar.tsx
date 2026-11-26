"use client";

import { RefreshCw } from "lucide-react";
import { restaurarAction } from "@/app/actions";
import { useToast } from "@/components/ui/Toast";

export function BotonRestaurar() {
  const { toast, confirmar } = useToast();

  const handleRestaurar = () => {
    confirmar({
      titulo: "¿Restaurar Base de Datos de Demostración?",
      mensaje:
        "Se repondrán los artículos iniciales, categorías, movimientos y turnos de demostración. Esta acción no se puede deshacer.",
      textoConfirmar: "Restaurar Demostración",
      tono: "peligro",
      onConfirmar: async () => {
        await restaurarAction();
        toast.exito("Base de datos de demostración restaurada con éxito.");
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleRestaurar}
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50/50 p-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100/70 transition active:scale-98"
    >
      <RefreshCw size={15} />
      Restaurar Datos de Demostración
    </button>
  );
}
