"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  Calendar,
  DollarSign,
  Edit2,
  FileText,
  Filter,
  Plus,
  Receipt,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { guardarGastoAction, borrarGastoAction } from "@/app/actions";
import { dinero, fechaCorta, hoyISO } from "@/lib/format";
import type { Gasto } from "@/lib/types";

const CATEGORIAS_GASTO = [
  "Fletes y Acarreos de Mercadería",
  "Combustible y Transporte",
  "Servicios Básicos (Luz/Agua/Internet)",
  "Alimentos y Viáticos de Cuadrilla",
  "Mantenimiento y Reparaciones",
  "Planilla, Sueldos y Adelantos",
  "Papelería, Empaque y Bolsas",
  "Otros Gastos Menores",
] as const;

export function GastosCrud({
  gastosIniciales,
  fechaHoy,
  resumenFinanciero,
  simboloMoneda = "C$",
}: {
  gastosIniciales: Gasto[];
  fechaHoy: string;
  resumenFinanciero?: any;
  simboloMoneda?: string;
}) {
  const { toast, confirmar } = useToast();
  const [q, setQ] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("TODAS");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Gastos de hoy
  const totalHoy = useMemo(() => {
    return gastosIniciales
      .filter((g) => String(g.fecha || "").slice(0, 10) === fechaHoy)
      .reduce((sum, g) => sum + g.monto, 0);
  }, [gastosIniciales, fechaHoy]);

  // Gastos del mes actual (primeros 7 caracteres del ISO: YYYY-MM)
  const mesActual = fechaHoy.slice(0, 7);
  const totalMes = useMemo(() => {
    return gastosIniciales
      .filter((g) => String(g.fecha || "").startsWith(mesActual))
      .reduce((sum, g) => sum + g.monto, 0);
  }, [gastosIniciales, mesActual]);

  // Total acumulado general
  const totalGeneral = useMemo(() => {
    return gastosIniciales.reduce((sum, g) => sum + g.monto, 0);
  }, [gastosIniciales]);

  // Filtro de búsqueda y categoría
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return gastosIniciales.filter((g) => {
      const matchTexto =
        !t ||
        g.concepto.toLowerCase().includes(t) ||
        (g.notas && g.notas.toLowerCase().includes(t)) ||
        g.categoria.toLowerCase().includes(t);
      const matchCat = categoriaSel === "TODAS" || g.categoria === categoriaSel;
      return matchTexto && matchCat;
    });
  }, [gastosIniciales, q, categoriaSel]);

  const abrirNuevo = () => {
    setGastoEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (gasto: Gasto) => {
    setGastoEditando(gasto);
    setModalAbierto(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. Tarjetas de Resumen KPI y Rentabilidad Operativa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Gastos de Hoy */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-bold">
            <TrendingDown size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gastos de Hoy</p>
            <p className="text-lg font-extrabold text-rose-600 tracking-tight font-mono">
              -{dinero(totalHoy, simboloMoneda)}
            </p>
          </div>
        </div>

        {/* Gastos del Mes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gastos del Mes</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight font-mono">
              -{dinero(totalMes, simboloMoneda)}
            </p>
          </div>
        </div>

        {/* Utilidad Operativa del Negocio */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Utilidad Operativa Hoy</p>
            <p className="text-lg font-extrabold text-emerald-700 tracking-tight font-mono">
              {resumenFinanciero?.utilidad !== undefined
                ? dinero(resumenFinanciero.utilidad, simboloMoneda)
                : `${simboloMoneda} 0.00`}
            </p>
          </div>
        </div>

        {/* Total General & Botón Nuevo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registros Totales</p>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight font-mono">
              {filtrados.length} salidas
            </p>
          </div>
          <button
            type="button"
            onClick={abrirNuevo}
            className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs"
          >
            <Plus size={15} />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtro por Categorías */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por concepto, comprobante, chofer o notas..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium outline-none focus:border-brand-yellow focus:bg-white focus:ring-2 focus:ring-brand-yellow/20"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={15} className="text-slate-400 ml-1" />
          <select
            value={categoriaSel}
            onChange={(e) => setCategoriaSel(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-brand-yellow focus:bg-white"
          >
            <option value="TODAS">Todas las Categorías</option>
            {CATEGORIAS_GASTO.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Listado Dual: Tarjetas en Móvil/Tablet y Tabla en Escritorio */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Vista Móvil / Tablet Vertical (lg:hidden) */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filtrados.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Wallet size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No se encontraron gastos con ese criterio.</p>
            </div>
          ) : (
            filtrados.map((g) => (
              <div key={g.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-500">{fechaCorta(g.fecha)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        <Tag size={10} className="text-slate-400" />
                        {g.categoria}
                      </span>
                    </div>
                    <p className="mt-1 font-bold text-sm text-slate-900 leading-snug">{g.concepto}</p>
                    {g.creadoPor && (
                      <span className="text-[10px] text-slate-400 font-medium">Por: {g.creadoPor}</span>
                    )}
                  </div>

                  <span className="font-mono font-extrabold text-sm text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 shrink-0">
                    -{dinero(g.monto, simboloMoneda)}
                  </span>
                </div>

                {g.notas && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-mono text-[11px]">
                    Soporte: {g.notas}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => abrirEditar(g)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 py-1 px-2.5 rounded-md bg-amber-50 hover:bg-amber-100 transition"
                  >
                    <Edit2 size={13} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmar({
                        titulo: `¿Eliminar gasto de ${dinero(g.monto, simboloMoneda)}?`,
                        mensaje: `Se removerá el registro del gasto "${g.concepto}".`,
                        textoConfirmar: "Eliminar Gasto",
                        tono: "peligro",
                        onConfirmar: async () => {
                          const formData = new FormData();
                          formData.append("id", g.id);
                          await borrarGastoAction(formData);
                          toast.exito("Gasto eliminado exitosamente.");
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
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Fecha</th>
                <th className="py-3.5 px-4">Concepto / Motivo</th>
                <th className="py-3.5 px-4">Categoría de Gasto</th>
                <th className="py-3.5 px-4 text-right">Monto Salida ({simboloMoneda})</th>
                <th className="py-3.5 px-4">Comprobante / Soporte</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Wallet size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No se encontraron gastos con ese criterio.</p>
                  </td>
                </tr>
              ) : (
                filtrados.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 sm:px-6 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {fechaCorta(g.fecha)}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{g.concepto}</p>
                      {g.creadoPor && (
                        <span className="text-[10px] text-slate-400 font-medium">Autorizado por: {g.creadoPor}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        <Tag size={11} className="text-slate-400" />
                        {g.categoria}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 text-xs sm:text-sm">
                      -{dinero(g.monto, simboloMoneda)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">
                      {g.notas ? (
                        <span className="rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-mono text-slate-700">
                          {g.notas}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirEditar(g)}
                          title="Editar gasto"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-600 transition"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          title="Eliminar gasto"
                          onClick={() => {
                            confirmar({
                              titulo: `¿Eliminar gasto de ${dinero(g.monto, simboloMoneda)}?`,
                              mensaje: `Esta acción retirará el registro de gasto "${g.concepto}" de los libros contables.`,
                              textoConfirmar: "Eliminar Registro",
                              tono: "peligro",
                              onConfirmar: async () => {
                                const formData = new FormData();
                                formData.append("id", g.id);
                                await borrarGastoAction(formData);
                                toast.exito(`Registro de gasto "${g.concepto}" eliminado.`);
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

      {/* 4. Modal CRUD: Registrar / Editar Gasto */}
      <Modal
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        titulo={gastoEditando ? "Editar Gasto de Operación" : "Registrar Salida de Dinero"}
        subtitulo="Anota cualquier pago en efectivo o salida de caja chica para cuadrar el turno operativo."
      >
        <form
          action={async (formData) => {
            setEnviando(true);
            try {
              await guardarGastoAction(null, formData);
              setModalAbierto(false);
            } finally {
              setEnviando(false);
            }
          }}
          className="space-y-4"
        >
          {gastoEditando && <input type="hidden" name="id" value={gastoEditando.id} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Fecha del Gasto *
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="date"
                  name="fecha"
                  required
                  defaultValue={gastoEditando?.fecha || fechaHoy}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Monto Salida ({simboloMoneda}) *
              </label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="number"
                  step="0.01"
                  name="monto"
                  required
                  min="0.01"
                  defaultValue={gastoEditando?.monto || ""}
                  placeholder="0.00"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs font-bold text-slate-800 font-mono outline-none focus:border-brand-yellow"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Concepto / Motivo de la Salida *
            </label>
            <input
              type="text"
              name="concepto"
              required
              defaultValue={gastoEditando?.concepto || ""}
              placeholder="Ej. Flete descargue de cemento, Combustible camión, Recibo de luz..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Categoría
            </label>
            <select
              name="categoria"
              defaultValue={gastoEditando?.categoria || "Fletes y Acarreos de Mercadería"}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
            >
              {CATEGORIAS_GASTO.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              No. Factura Proveedor, Recibo o Soporte
            </label>
            <input
              type="text"
              name="notas"
              defaultValue={gastoEditando?.notas || ""}
              placeholder="Ej. Recibo de caja #4412, firmado por chofer..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
            />
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
              {enviando ? "Guardando..." : gastoEditando ? "Guardar Cambios" : "Registrar Gasto"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
