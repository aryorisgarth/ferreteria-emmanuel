"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Edit2,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { guardarClienteAction, borrarClienteAction } from "@/app/actions";
import type { Cliente } from "@/lib/types";

export function ClientesCrud({
  clientesIniciales,
  totalServidor,
  totalPaginasServidor,
  paginaServidor,
  qServidor = "",
}: {
  clientesIniciales: Cliente[];
  totalServidor?: number;
  totalPaginasServidor?: number;
  paginaServidor?: number;
  qServidor?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const esPaginacionServidor = totalServidor !== undefined;

  const { toast, confirmar } = useToast();
  const [q, setQ] = useState(qServidor);
  const debouncedQ = useDebounce(q, 300);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Sincronizar búsqueda hacia el servidor si la paginación está en servidor
  useEffect(() => {
    if (esPaginacionServidor && debouncedQ !== qServidor) {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
      if (debouncedQ.trim()) {
        params.set("q", debouncedQ.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [debouncedQ, esPaginacionServidor, qServidor, pathname, router, searchParams]);

  // Filtrado local de respaldo si no está habilitada paginación en servidor
  const filtrados = useMemo(() => {
    if (esPaginacionServidor) return clientesIniciales;
    const t = debouncedQ.trim().toLowerCase();
    if (!t) return clientesIniciales;
    return clientesIniciales.filter(
      (c) =>
        c.nombre.toLowerCase().includes(t) ||
        (c.telefono && c.telefono.toLowerCase().includes(t)) ||
        (c.notas && c.notas.toLowerCase().includes(t)) ||
        (c.direccion && c.direccion.toLowerCase().includes(t)),
    );
  }, [clientesIniciales, debouncedQ, esPaginacionServidor]);

  // Paginación local de respaldo
  const [paginaActualLocal, setPaginaActualLocal] = useState(1);
  const CLIENTES_POR_PAGINA = 24;
  const totalPaginasLocal = Math.max(1, Math.ceil(filtrados.length / CLIENTES_POR_PAGINA));

  useEffect(() => {
    if (!esPaginacionServidor) {
      setPaginaActualLocal(1);
    }
  }, [debouncedQ, esPaginacionServidor]);

  const clientesPaginadosLocal = useMemo(() => {
    const inicio = (paginaActualLocal - 1) * CLIENTES_POR_PAGINA;
    return filtrados.slice(inicio, inicio + CLIENTES_POR_PAGINA);
  }, [filtrados, paginaActualLocal]);

  // Valores unificados
  const clientesVisibles = esPaginacionServidor ? clientesIniciales : clientesPaginadosLocal;
  const totalClientes = esPaginacionServidor ? (totalServidor ?? clientesIniciales.length) : filtrados.length;
  const totalPaginas = esPaginacionServidor ? (totalPaginasServidor ?? 1) : totalPaginasLocal;
  const paginaActual = esPaginacionServidor ? (paginaServidor ?? 1) : paginaActualLocal;

  const cambiarPagina = (nuevaPagina: number) => {
    if (esPaginacionServidor) {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
      params.set("page", String(nuevaPagina));
      if (q.trim()) params.set("q", q.trim());
      router.push(`${pathname}?${params.toString()}`);
    } else {
      setPaginaActualLocal(nuevaPagina);
    }
  };

  const abrirNuevo = () => {
    setClienteEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setModalAbierto(true);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Herramientas y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-[6px] border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, teléfono, RUC o dirección..."
            className="h-9 w-full rounded-[5px] border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
            {totalClientes} cliente{totalClientes === 1 ? "" : "s"} registrado{totalClientes === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={abrirNuevo}
            className="btn btn-amarillo h-9 px-3.5 text-xs font-bold gap-1.5 shadow-2xs rounded-[5px]"
          >
            <Plus size={15} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Listado Dual: Tarjetas para Móvil/Tablet y Tabla para Escritorio */}
      <div className="bg-white rounded-[6px] border border-slate-200 shadow-2xs overflow-hidden">
        {/* Vista Móvil / Tablet Vertical (lg:hidden) */}
        <div className="lg:hidden divide-y divide-slate-100">
          {clientesVisibles.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <User size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No se encontraron clientes con ese criterio.</p>
            </div>
          ) : (
            clientesVisibles.map((c) => (
              <div key={c.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-bold text-sm text-slate-900 hover:text-amber-600 transition block leading-snug"
                    >
                      {c.nombre}
                    </Link>
                    {c.notas && (
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        RUC/Cédula: <strong>{c.notas}</strong>
                      </p>
                    )}
                  </div>

                  {c.limiteCredito && c.limiteCredito > 0 ? (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                      Crédito C$ {c.limiteCredito}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  {c.telefono ? (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span className="font-mono">{c.telefono}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Sin teléfono</span>
                  )}
                  {c.direccion && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{c.direccion}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 px-2 rounded-md hover:bg-slate-100 transition"
                  >
                    <ExternalLink size={13} />
                    Perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => abrirEditar(c)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 py-1 px-2.5 rounded-md bg-amber-50 hover:bg-amber-100 transition"
                  >
                    <Edit2 size={13} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmar({
                        titulo: `¿Eliminar a ${c.nombre}?`,
                        mensaje: "Esta acción removerá el cliente si no tiene facturas o cotizaciones pendientes.",
                        textoConfirmar: "Eliminar Cliente",
                        tono: "peligro",
                        onConfirmar: async () => {
                          const formData = new FormData();
                          formData.append("id", c.id);
                          await borrarClienteAction(formData);
                          toast.exito(`Cliente ${c.nombre} eliminado.`);
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
                <th className="py-3 px-4 sm:px-6">Cliente / Razón Social</th>
                <th className="py-3 px-4">Teléfono / WhatsApp</th>
                <th className="py-3 px-4">Dirección</th>
                <th className="py-3 px-4">RUC / Notas</th>
                <th className="py-3 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesVisibles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <User size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No se encontraron clientes con esos datos.</p>
                  </td>
                </tr>
              ) : (
                clientesVisibles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 sm:px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 font-extrabold text-sm">
                          {c.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/clientes/${c.id}`}
                            className="font-bold text-slate-900 hover:text-amber-600 transition flex items-center gap-1 text-sm"
                          >
                            {c.nombre}
                            <ExternalLink size={12} className="opacity-40" />
                          </Link>
                          <span className="text-[11px] text-slate-400 font-normal">Cliente Comercial</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs font-mono">
                      {c.telefono ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone size={13} className="text-slate-400" />
                          <span>{c.telefono}</span>
                          <a
                            href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir chat en WhatsApp"
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
                      {c.direccion ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{c.direccion}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate font-mono">
                      {c.notas ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {c.notas}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                        >
                          Historial
                        </Link>
                        <button
                          type="button"
                          onClick={() => abrirEditar(c)}
                          title="Editar cliente"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-600 transition"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          title="Eliminar cliente"
                          onClick={() => {
                            confirmar({
                              titulo: `¿Eliminar al cliente "${c.nombre}"?`,
                              mensaje: "Esta acción retirará la ficha de cliente del directorio activo.",
                              textoConfirmar: "Eliminar Cliente",
                              tono: "peligro",
                              onConfirmar: async () => {
                                const formData = new FormData();
                                formData.append("id", c.id);
                                await borrarClienteAction(formData);
                                toast.exito(`Cliente "${c.nombre}" eliminado del directorio.`);
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

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Mostrando <span className="font-bold text-slate-700">{clientesVisibles.length}</span> de{" "}
              <span className="font-bold text-slate-700">{totalClientes}</span> clientes encontrados
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => cambiarPagina(Math.max(1, paginaActual - 1))}
                className="btn btn-linea h-8 px-3 text-xs font-semibold disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-xs font-mono font-bold text-slate-600 px-2">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => cambiarPagina(Math.min(totalPaginas, paginaActual + 1))}
                className="btn btn-linea h-8 px-3 text-xs font-semibold disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal CRUD Cliente */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo={clienteEditando ? "Editar Cliente" : "Nuevo Cliente"}
        subtitulo={
          clienteEditando
            ? "Modifica los datos de contacto y facturación del cliente."
            : "Registra un cliente frecuente o empresa para cotizar y facturar."
        }
      >
        <form
          action={async (formData) => {
            setEnviando(true);
            try {
              await guardarClienteAction(null, formData);
              setModalAbierto(false);
            } finally {
              setEnviando(false);
            }
          }}
          className="space-y-4"
        >
          {clienteEditando && <input type="hidden" name="id" value={clienteEditando.id} />}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nombre o Razón Social <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                name="nombre"
                required
                defaultValue={clienteEditando?.nombre || ""}
                placeholder="Ej. Constructora San José o Juan Pérez"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  name="telefono"
                  defaultValue={clienteEditando?.telefono || ""}
                  placeholder="+505 8888-0000"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                R.U.C. o Cédula (Nicaragua)
              </label>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  name="notas"
                  defaultValue={clienteEditando?.notas || ""}
                  placeholder="J0310000000000"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Dirección de Entrega o Facturación
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                name="direccion"
                defaultValue={clienteEditando?.direccion || ""}
                placeholder="Ej. Managua, de la Rotonda El Periodista 2c. al sur"
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
              {enviando ? "Guardando..." : clienteEditando ? "Guardar Cambios" : "Crear Cliente"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
