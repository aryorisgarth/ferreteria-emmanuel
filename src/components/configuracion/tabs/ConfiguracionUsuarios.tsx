"use client";

import { useState } from "react";
import { Edit2, Trash2, UserPlus, KeyRound } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { eliminarUsuarioAction } from "@/app/actions";
import { ModalUsuario } from "./ModalUsuario";
import { ModalRestablecerAcceso } from "./ModalRestablecerAcceso";
import type { ConfiguracionSistema } from "@/lib/config";

interface ConfiguracionUsuariosProps {
  usuarios: ConfiguracionSistema["usuarios"];
}

export function ConfiguracionUsuarios({ usuarios }: ConfiguracionUsuariosProps) {
  const { toast, confirmar } = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<ConfiguracionSistema["usuarios"][number] | null>(null);
  const [restableciendo, setRestableciendo] = useState<ConfiguracionSistema["usuarios"][number] | null>(null);

  const abrirNuevo = () => {
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (u: ConfiguracionSistema["usuarios"][number]) => {
    setEditando(u);
    setModalAbierto(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Control de Usuarios y Cajeros</h3>
          <p className="text-xs text-slate-500">
            Administra quién tiene acceso al mostrador, auditoría de kárdex y operaciones.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs"
        >
          <UserPlus size={16} />
          Nuevo Cajero / Usuario
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Nombre Completo</th>
              <th className="py-3 px-4">Rol en Ferretería</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">@{u.usuario}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">{u.nombre}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                    {u.rol}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Activo
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {u.usuario !== "admin" && (
                      <button
                        type="button"
                        onClick={() => setRestableciendo(u)}
                        title="Restablecer acceso (Clave temporal)"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-700 transition"
                      >
                        <KeyRound size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => abrirEditar(u)}
                      title="Editar usuario"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    {u.usuario !== "admin" && (
                      <button
                        type="button"
                        title="Eliminar usuario"
                        onClick={() => {
                          confirmar({
                            titulo: `¿Eliminar al usuario @${u.usuario}?`,
                            mensaje: `Esta acción revocará de inmediato el acceso de ${u.nombre} a todos los módulos del sistema.`,
                            textoConfirmar: "Eliminar Usuario",
                            tono: "peligro",
                            onConfirmar: async () => {
                              const formData = new FormData();
                              formData.append("id", u.id);
                              await eliminarUsuarioAction(formData);
                              toast.exito(`Usuario @${u.usuario} eliminado del sistema.`);
                            },
                          });
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalUsuario
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        usuario={editando}
      />

      <ModalRestablecerAcceso
        abierto={!!restableciendo}
        alCerrar={() => setRestableciendo(null)}
        usuario={restableciendo}
      />
    </div>
  );
}
