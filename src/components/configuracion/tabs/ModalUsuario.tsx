"use client";

import { Modal } from "@/components/ui/Modal";
import { guardarUsuarioAction } from "@/app/actions";
import type { ConfiguracionSistema } from "@/lib/config";

interface ModalUsuarioProps {
  abierto: boolean;
  alCerrar: () => void;
  usuario: ConfiguracionSistema["usuarios"][number] | null;
}

export function ModalUsuario({ abierto, alCerrar, usuario }: ModalUsuarioProps) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={usuario ? "Editar Usuario / Cajero" : "Nuevo Cajero o Personal"}
      subtitulo="Asigna el usuario y rol para operar el mostrador o la bodega."
      anchoMax="xl"
    >
      <form action={guardarUsuarioAction} className="space-y-4">
        {usuario && <input type="hidden" name="id" value={usuario.id} />}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Nombre Completo <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            required
            defaultValue={usuario?.nombre || ""}
            placeholder="Ej. Carlos Mendoza"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-yellow"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nombre de Usuario (Login) <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              name="usuario"
              required
              defaultValue={usuario?.usuario || ""}
              placeholder="carlos"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono placeholder-slate-400 outline-none focus:border-brand-yellow"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Rol en el Sistema
            </label>
            <select
              name="rol"
              defaultValue={usuario?.rol || "CAJERO"}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-yellow"
            >
              <option value="CAJERO">Cajero / Mostrador</option>
              <option value="VENDEDOR">Vendedor</option>
              <option value="BODEGUERO">Bodeguero / Almacén</option>
              <option value="ADMINISTRADOR">Administrador General</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            {usuario ? "Nueva Contraseña (Opcional)" : "Contraseña de Acceso"} {!usuario && <span className="text-amber-500">*</span>}
          </label>
          <input
            type="password"
            name="clave"
            placeholder={usuario ? "Dejar vacío para conservar la contraseña actual" : "Mínimo 4 caracteres (ej. clave123)"}
            required={!usuario}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-yellow"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {usuario
              ? "Solo llena este campo si deseas cambiar la clave de acceso del usuario."
              : "El cajero o encargado utilizará esta contraseña para ingresar al sistema."}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={alCerrar}
            className="h-9 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-amarillo h-9 px-4 text-xs font-bold shadow-xs">
            {usuario ? "Guardar Cambios" : "Crear Usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
