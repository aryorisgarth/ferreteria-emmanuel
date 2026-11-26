"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Edit2,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { guardarProveedorAction, borrarProveedorAction } from "@/app/actions";
import type { Proveedor } from "@/lib/types";

export function ProveedoresCrud({ proveedoresIniciales }: { proveedoresIniciales: Proveedor[] }) {
  const { toast, confirmar } = useToast();
  const [q, setQ] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);
  const [enviando, setEnviando] = useState(false);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return proveedoresIniciales;
    return proveedoresIniciales.filter(
      (p) =>
        p.nombre.toLowerCase().includes(t) ||
        (p.telefono && p.telefono.toLowerCase().includes(t)) ||
        (p.notas && p.notas.toLowerCase().includes(t)) ||
        (p.direccion && p.direccion.toLowerCase().includes(t)),
    );
  }, [proveedoresIniciales, q]);

  const abrirNuevo = () => {
    setProveedorEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (p: Proveedor) => {
    setProveedorEditando(p);
    setModalAbierto(true);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda y Botón Nuevo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar distribuidora, marca, teléfono o RUC..."
            className="h-9 w-full rounded-[5px] border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
            {filtrados.length} proveedor{filtrados.length === 1 ? "" : "es"} registrado{filtrados.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={abrirNuevo}
            className="btn btn-amarillo h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]"
          >
            <Plus size={15} />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Listado Dual: Tarjetas para Móvil/Tablet y Tabla para Escritorio */}
      <div className="bg-white rounded-[6px] border border-slate-200 shadow-2xs overflow-hidden">
        {/* Vista Móvil / Tablet Vertical (lg:hidden) */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filtrados.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Warehouse size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No se encontraron proveedores registrados.</p>
            </div>
          ) : (
            filtrados.map((p) => (
              <div key={p.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/proveedores/${p.id}`}
                      className="font-bold text-sm text-slate-900 hover:text-amber-600 transition block leading-snug"
                    >
                      {p.nombre}
                    </Link>
                    {p.notas && (
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        RUC: <strong>{p.notas}</strong>
                      </p>
                    )}
                  </div>

                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">
                    Distribuidor
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  {p.telefono ? (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span className="font-mono">{p.telefono}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Sin teléfono</span>
                  )}
                  {p.direccion && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{p.direccion}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <Link
                    href={`/proveedores/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 px-2 rounded-md hover:bg-slate-100 transition"
                  >
                    <ExternalLink size={13} />
                    Ver Perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => abrirEditar(p)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 py-1 px-2.5 rounded-md bg-amber-50 hover:bg-amber-100 transition"
                  >
                    <Edit2 size={13} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmar({
                        titulo: `¿Eliminar a ${p.nombre}?`,
                        mensaje: "Esta acción removerá el proveedor del directorio siempre que no tenga compras vinculadas.",
                        textoConfirmar: "Eliminar Proveedor",
                        tono: "peligro",
                        onConfirmar: async () => {
                          const formData = new FormData();
                          formData.append("id", p.id);
                          await borrarProveedorAction(formData);
                          toast.exito(`Proveedor ${p.nombre} eliminado.`);
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 py-1 px-2 rounded-md hover:bg-rose-50 transition"
                  >
                    <Trash2 size={13} />
                    Borrar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vista Tabla para Escritorio (hidden lg:block) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="tabla w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 sm:px-6">Distribuidora / Fabricante</th>
                <th className="py-3 px-4">Teléfono / Pedidos</th>
                <th className="py-3 px-4">Ubicación / Despacho</th>
                <th className="py-3 px-4">RUC / Términos</th>
                <th className="py-3 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Warehouse size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No se encontraron proveedores registrados.</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 sm:px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 font-extrabold text-sm">
                          {p.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/proveedores/${p.id}`}
                            className="font-bold text-slate-900 hover:text-amber-600 transition flex items-center gap-1 text-sm"
                          >
                            {p.nombre}
                            <ExternalLink size={12} className="opacity-40" />
                          </Link>
                          <span className="text-[11px] text-slate-400 font-normal">Proveedor de Materiales</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs font-mono">
                      {p.telefono ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone size={13} className="text-slate-400" />
                          <span>{p.telefono}</span>
                          <a
                            href={`https://wa.me/${p.telefono.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Contactar al proveedor por WhatsApp"
                            className="text-emerald-600 hover:text-emerald-700 p-0.5"
                          >
                            <MessageCircle size={14} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {p.direccion ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{p.direccion}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate font-mono">
                      {p.notas ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {p.notas}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/proveedores/${p.id}`}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                        >
                          Historial
                        </Link>
                        <button
                          type="button"
                          onClick={() => abrirEditar(p)}
                          title="Editar proveedor"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-600 transition"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          title="Eliminar proveedor"
                          onClick={() => {
                            confirmar({
                              titulo: `¿Eliminar al proveedor "${p.nombre}"?`,
                              mensaje: "Esta acción retirará la empresa proveedora del directorio.",
                              textoConfirmar: "Eliminar Proveedor",
                              tono: "peligro",
                              onConfirmar: async () => {
                                const formData = new FormData();
                                formData.append("id", p.id);
                                await borrarProveedorAction(formData);
                                toast.exito(`Proveedor "${p.nombre}" eliminado del directorio.`);
                              },
                            });
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:text-rose-600 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD Proveedor */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo={proveedorEditando ? "Editar Proveedor" : "Nuevo Proveedor"}
        subtitulo={
          proveedorEditando
            ? "Modifica los datos comerciales y de contacto del distribuidor."
            : "Registra una fábrica o distribuidora para compras y reabastecimiento."
        }
      >
        <form
          action={async (formData) => {
            setEnviando(true);
            try {
              await guardarProveedorAction(null, formData);
              setModalAbierto(false);
            } finally {
              setEnviando(false);
            }
          }}
          className="space-y-4"
        >
          {proveedorEditando && <input type="hidden" name="id" value={proveedorEditando.id} />}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nombre de la Distribuidora o Empresa <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <Truck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                name="nombre"
                required
                defaultValue={proveedorEditando?.nombre || ""}
                placeholder="Ej. Distribuidora Holcim, Amanco o Plycem Nicaragua"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Teléfono de Pedidos
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  name="telefono"
                  defaultValue={proveedorEditando?.telefono || ""}
                  placeholder="+505 2222-0000"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                R.U.C. (Nicaragua)
              </label>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  name="notas"
                  defaultValue={proveedorEditando?.notas || ""}
                  placeholder="J0310000000000"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Dirección de Planta o Bodega de Despacho
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                name="direccion"
                defaultValue={proveedorEditando?.direccion || ""}
                placeholder="Ej. Carretera Norte Km 5.5, Managua"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="btn btn-linea h-10 px-4 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="btn btn-amarillo h-10 px-5 text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {enviando ? "Guardando..." : proveedorEditando ? "Guardar Cambios" : "Crear Proveedor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
