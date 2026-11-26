"use client";

import { guardarProveedorAction } from "@/app/actions";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Proveedor } from "@/lib/types";

interface ModalNuevoProveedorCompraProps {
  abierto: boolean;
  alCerrar: () => void;
  onProveedorCreado: (prov: Proveedor) => void;
}

export function ModalNuevoProveedorCompra({
  abierto,
  alCerrar,
  onProveedorCreado,
}: ModalNuevoProveedorCompraProps) {
  const { toast } = useToast();

  return (
    <Modal abierto={abierto} alCerrar={alCerrar} titulo="Nuevo Proveedor / Distribuidora" anchoMax="md">
      <form
        action={async (fd) => {
          const res = await guardarProveedorAction(null as any, fd);
          if (res && !res.ok) {
            toast.error(res.error || "No se pudo registrar.", "Error");
            return;
          }
          const nombre = String(fd.get("nombre") || "");
          const nuevo: Proveedor = {
            id: crypto.randomUUID(),
            nombre,
            telefono: String(fd.get("telefono") || ""),
            contacto: String(fd.get("contacto") || ""),
            direccion: "",
            notas: "",
          };
          onProveedorCreado(nuevo);
          toast.exito("Proveedor registrado exitosamente.");
          alCerrar();
        }}
        className="space-y-3 text-xs"
      >
        <div>
          <label className="block font-bold text-slate-700 mb-1">Nombre o Razón Social *</label>
          <input
            name="nombre"
            required
            placeholder="Ej. Distribuidora Eléctrica / Holcim"
            className="h-9 w-full rounded border border-slate-300 px-3 outline-none focus:border-blue-600"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
          <input
            name="telefono"
            placeholder="Ej. +505 2244-0000"
            className="h-9 w-full rounded border border-slate-300 px-3 outline-none focus:border-blue-600"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Contacto / Asesor</label>
          <input
            name="contacto"
            placeholder="Ej. Lic. Roberto Gómez"
            className="h-9 w-full rounded border border-slate-300 px-3 outline-none focus:border-blue-600"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={alCerrar} className="btn btn-linea h-8 text-xs font-semibold">
            Cancelar
          </button>
          <button type="submit" className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white h-8 px-4 rounded text-xs font-bold transition">
            Guardar Proveedor
          </button>
        </div>
      </form>
    </Modal>
  );
}
