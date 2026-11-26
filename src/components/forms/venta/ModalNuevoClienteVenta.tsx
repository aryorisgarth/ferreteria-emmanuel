"use client";

import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { guardarClienteAction } from "@/app/actions";
import type { Cliente } from "@/lib/types";

interface ModalNuevoClienteVentaProps {
  abierto: boolean;
  alCerrar: () => void;
  onClienteCreado: (cliente: Cliente) => void;
}

export function ModalNuevoClienteVenta({
  abierto,
  alCerrar,
  onClienteCreado,
}: ModalNuevoClienteVentaProps) {
  const { toast } = useToast();

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Registrar Nuevo Cliente"
      subtitulo="Cree el cliente y se seleccionará automáticamente en esta operación."
      anchoMax="xl"
    >
      <form
        action={async (formData) => {
          const nombre = String(formData.get("nombre") || "");
          const res = await guardarClienteAction(null as any, formData);
          if (res && !res.ok) {
            toast.error(res.error || "No se pudo registrar el cliente.", "Error");
            return;
          }
          const nuevo: Cliente = {
            id: crypto.randomUUID(),
            nombre,
            telefono: String(formData.get("telefono") || ""),
            direccion: String(formData.get("direccion") || ""),
            notas: String(formData.get("notas") || ""),
          };
          onClienteCreado(nuevo);
          toast.exito(`Cliente "${nombre}" registrado y seleccionado.`);
          alCerrar();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Nombre o Razón Social <span className="text-amber-500">*</span>
          </label>
          <input
            name="nombre"
            required
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-brand-yellow"
            placeholder="Ej. Ing. Carlos Mendoza / Constructora"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Teléfono
            </label>
            <input
              name="telefono"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900 outline-none focus:border-brand-yellow"
              placeholder="+505 8888-0000"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              R.U.C. / Cédula
            </label>
            <input
              name="notas"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900 outline-none focus:border-brand-yellow"
              placeholder="J0310000000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Dirección
          </label>
          <input
            name="direccion"
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900 outline-none focus:border-brand-yellow"
            placeholder="Managua, Nicaragua"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={alCerrar}
            className="h-10 rounded-lg px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-amarillo h-10 px-5 text-xs font-bold shadow-xs">
            Guardar y Seleccionar
          </button>
        </div>
      </form>
    </Modal>
  );
}
