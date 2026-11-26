"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { dinero, etiquetaUnidad, fechaCorta } from "@/lib/format";
import type { Cotizacion, ProductoVista } from "@/lib/types";

export interface ItemImportarCotizacion {
  producto: ProductoVista;
  cantidad: number;
  precioPersonalizado: number;
  descuentoUnitario: number;
  exentoIva: boolean;
  cotizacionItemId: string;
  cantidadMaximaPermitida: number;
}

export interface ModalCargarCotizacionProps {
  abierto: boolean;
  alCerrar: () => void;
  cotizacionesDisponibles?: Cotizacion[];
  catalogo: ProductoVista[];
  onImportarCotizacion: (datos: {
    cotizacionId: string;
    cotizacionNumero: string;
    cotizacionVersion: number;
    clienteId: string | null;
    clienteNombre: string;
    itemsAImportar: ItemImportarCotizacion[];
  }) => void;
  simboloMoneda?: string;
}

const ESTADOS_FACTURABLES = new Set([
  "AUTORIZADA",
  "PARCIALMENTE_FACTURADA",
  "EMITIDA",
  "ACEPTADA",
]);

export function ModalCargarCotizacion({
  abierto,
  alCerrar,
  cotizacionesDisponibles = [],
  catalogo,
  onImportarCotizacion,
  simboloMoneda = "C$",
}: ModalCargarCotizacionProps) {
  const [q, setQ] = useState("");
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<Cotizacion | null>(null);

  // Cantidades seleccionadas para facturar por cada ítem de la cotización { [itemId]: cantidad }
  const [cantidadesSeleccionadas, setCantidadesSeleccionadas] = useState<Record<string, number>>({});
  // Ítems marcados para inclusión { [itemId]: boolean }
  const [itemsIncluidos, setItemsIncluidos] = useState<Record<string, boolean>>({});

  // Filtrar exclusivamente cotizaciones en estados facturables y que no estén sustituidas
  const facturables = useMemo(() => {
    return cotizacionesDisponibles
      .filter((c) => {
        const estadoValido = ESTADOS_FACTURABLES.has(c.estado);
        const versionActiva = c.esVersionActual !== false;
        return estadoValido && versionActiva;
      })
      .filter((c) => {
        if (!q.trim()) return true;
        const term = q.trim().toLowerCase();
        return (
          c.numero.toLowerCase().includes(term) ||
          c.cliente.toLowerCase().includes(term) ||
          (c.folio && c.folio.toLowerCase().includes(term))
        );
      });
  }, [cotizacionesDisponibles, q]);

  // Al seleccionar una cotización, inicializar cantidades con su saldo pendiente
  const seleccionarCotizacion = (cot: Cotizacion) => {
    setCotizacionSeleccionada(cot);
    const inicialCant: Record<string, number> = {};
    const inicialInc: Record<string, boolean> = {};

    for (const item of cot.items || []) {
      const maxPendiente = item.cantidadPendiente !== undefined ? item.cantidadPendiente : item.cantidad;
      if (maxPendiente > 0) {
        inicialCant[item.id] = maxPendiente;
        inicialInc[item.id] = true;
      } else {
        inicialCant[item.id] = 0;
        inicialInc[item.id] = false;
      }
    }

    setCantidadesSeleccionadas(inicialCant);
    setItemsIncluidos(inicialInc);
  };

  const cerrarYLimpiar = () => {
    setCotizacionSeleccionada(null);
    setQ("");
    alCerrar();
  };

  // Cálculos dinámicos de los ítems seleccionados para facturar
  const itemsCalculados = useMemo(() => {
    if (!cotizacionSeleccionada) return [];

    return (cotizacionSeleccionada.items || []).map((item) => {
      const prodCatalogo = catalogo.find((p) => p.id === item.productoId);
      const maxPendiente = item.cantidadPendiente !== undefined ? item.cantidadPendiente : item.cantidad;
      const cantAFacturar = cantidadesSeleccionadas[item.id] ?? maxPendiente;
      const incluido = itemsIncluidos[item.id] ?? (maxPendiente > 0);
      const remanenteDespues = Math.max(0, maxPendiente - (incluido ? cantAFacturar : 0));

      const precioUnitario = item.precio;
      const descuentoUnitario = item.descuento || 0;
      const precioEfectivo = Math.max(0, precioUnitario - descuentoUnitario);
      const subtotalLinea = cantAFacturar * precioEfectivo;
      const ivaLinea = item.exentoIva ? 0 : subtotalLinea * 0.15;
      const totalLinea = subtotalLinea + ivaLinea;

      return {
        item,
        prodCatalogo,
        maxPendiente,
        cantAFacturar,
        incluido,
        remanenteDespues,
        precioUnitario,
        descuentoUnitario,
        subtotalLinea,
        ivaLinea,
        totalLinea,
      };
    });
  }, [cotizacionSeleccionada, catalogo, cantidadesSeleccionadas, itemsIncluidos]);

  // Resumen del importe de la selección actual
  const resumenSeleccion = useMemo(() => {
    const incluidos = itemsCalculados.filter((it) => it.incluido && it.cantAFacturar > 0);
    const subtotal = incluidos.reduce((acc, it) => acc + it.subtotalLinea, 0);
    const iva = incluidos.reduce((acc, it) => acc + it.ivaLinea, 0);
    const total = subtotal + iva;
    const totalArticulos = incluidos.reduce((acc, it) => acc + it.cantAFacturar, 0);

    return {
      subtotal,
      iva,
      total,
      totalArticulos,
      cantidadLineas: incluidos.length,
    };
  }, [itemsCalculados]);

  // Manejador de cambio de cantidad
  const cambiarCantidad = (itemId: string, nuevaCant: number, maxPermitido: number) => {
    const cantAjustada = Math.min(maxPermitido, Math.max(0, Math.round(nuevaCant * 1000) / 1000));
    setCantidadesSeleccionadas((prev) => ({ ...prev, [itemId]: cantAjustada }));
    if (cantAjustada > 0) {
      setItemsIncluidos((prev) => ({ ...prev, [itemId]: true }));
    }
  };

  const toggleIncluido = (itemId: string) => {
    setItemsIncluidos((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Confirmar e importar al carrito de Caja
  const handleImportar = () => {
    if (!cotizacionSeleccionada) return;

    const itemsAImportar: ItemImportarCotizacion[] = [];

    for (const calc of itemsCalculados) {
      if (calc.incluido && calc.cantAFacturar > 0 && calc.prodCatalogo) {
        itemsAImportar.push({
          producto: calc.prodCatalogo,
          cantidad: calc.cantAFacturar,
          precioPersonalizado: calc.precioUnitario,
          descuentoUnitario: calc.descuentoUnitario,
          exentoIva: !!calc.item.exentoIva,
          cotizacionItemId: calc.item.id,
          cantidadMaximaPermitida: calc.maxPendiente,
        });
      }
    }

    if (itemsAImportar.length === 0) return;

    onImportarCotizacion({
      cotizacionId: cotizacionSeleccionada.id,
      cotizacionNumero: cotizacionSeleccionada.numero,
      cotizacionVersion: cotizacionSeleccionada.version || 1,
      clienteId: cotizacionSeleccionada.clienteId || null,
      clienteNombre: cotizacionSeleccionada.cliente,
      itemsAImportar,
    });

    cerrarYLimpiar();
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={cerrarYLimpiar}
      titulo={
        cotizacionSeleccionada
          ? `Cotización ${cotizacionSeleccionada.numero} (v${cotizacionSeleccionada.version || 1})`
          : "Cargar Cotización al Mostrador"
      }
      subtitulo={
        cotizacionSeleccionada
          ? "Seleccione los productos y cantidades a facturar. Los precios autorizados permanecen congelados."
          : "Busque y seleccione una cotización autorizada o parcialmente facturada para importar sus saldos."
      }
      anchoMax="5xl"
    >
      {!cotizacionSeleccionada ? (
        // VISTA 1: LISTADO Y BÚSQUEDA DE COTIZACIONES
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por cliente, número de cotización o folio..."
              className="w-full pl-10 pr-3 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoFocus
            />
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {facturables.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileText size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold text-slate-600">No se encontraron cotizaciones facturables</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Solo las cotizaciones en estado AUTORIZADA o PARCIALMENTE_FACTURADA y en su versión vigente pueden cargarse en Caja.
                </p>
              </div>
            ) : (
              facturables.map((cot) => (
                <div
                  key={cot.id}
                  onClick={() => seleccionarCotizacion(cot)}
                  className="p-3 hover:bg-amber-50/60 cursor-pointer transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-amber-800">
                        {cot.numero}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        v{cot.version || 1}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                          cot.estado === "AUTORIZADA"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {cot.estado === "AUTORIZADA" ? "Autorizada" : "Parcialmente facturada"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-700 truncate">{cot.cliente}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{fechaCorta(cot.fecha)}</span>
                      <span>·</span>
                      <span>{(cot.items || []).length} productos</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">
                      {dinero(cot.total || 0, simboloMoneda)}
                    </p>
                    <span className="text-[11px] font-bold text-amber-700 group-hover:underline flex items-center justify-end gap-1 mt-1">
                      Seleccionar →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={cerrarYLimpiar}
              className="btn btn-linea h-9 px-4 text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        // VISTA 2: SELECCIÓN DETALLADA DE PRODUCTOS Y CANTIDADES A FACTURAR
        <div className="space-y-4">
          {/* Encabezado de la cotización seleccionada */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-500">Cliente:</span>{" "}
              <strong className="text-slate-800">{cotizacionSeleccionada.cliente}</strong>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Emitida el {fechaCorta(cotizacionSeleccionada.fecha)} · Versión vigente {cotizacionSeleccionada.version || 1}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCotizacionSeleccionada(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
            >
              <ArrowLeft size={13} />
              Cambiar cotización
            </button>
          </div>

          {/* Tabla de productos cotizados sin scroll anidado */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
            {itemsCalculados.map((it) => (
              <div
                key={it.item.id}
                className={`p-3 transition ${
                  it.incluido ? "bg-white" : "bg-slate-50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Selector y nombre del producto */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={it.incluido}
                      onChange={() => toggleIncluido(it.item.id)}
                      disabled={it.maxPendiente <= 0}
                      className="mt-1 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {it.prodCatalogo?.nombre || it.item.productoId}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          <Lock size={10} className="text-slate-500" />
                          {dinero(it.precioUnitario, simboloMoneda)} / {etiquetaUnidad(it.item.unidadMedida)}
                          <span className="text-[10px] text-slate-400 font-sans">(Solo lectura)</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Saldo pendiente: <strong className="text-slate-800">{it.maxPendiente}</strong>
                        </span>
                        {it.remanenteDespues > 0 && it.incluido && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            Quedarán {it.remanenteDespues} pend.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selector de cantidad y subtotal */}
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(it.item.id, it.cantAFacturar - 1, it.maxPendiente)}
                        disabled={!it.incluido || it.cantAFacturar <= 1}
                        className="h-7 w-7 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-700"
                      >
                        <Minus size={12} />
                      </button>

                      <input
                        type="number"
                        min={1}
                        max={it.maxPendiente}
                        step="any"
                        value={it.cantAFacturar}
                        onChange={(e) =>
                          cambiarCantidad(it.item.id, Number(e.target.value) || 0, it.maxPendiente)
                        }
                        disabled={!it.incluido}
                        className="w-16 h-7 text-center font-bold text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100"
                      />

                      <button
                        type="button"
                        onClick={() => cambiarCantidad(it.item.id, it.cantAFacturar + 1, it.maxPendiente)}
                        disabled={!it.incluido || it.cantAFacturar >= it.maxPendiente}
                        className="h-7 w-7 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-700"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span className="text-xs font-bold text-slate-900">
                      {dinero(it.incluido ? it.subtotalLinea : 0, simboloMoneda)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen monetario de la selección parcial */}
          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <p className="text-slate-600">
                Seleccionados: <strong>{resumenSeleccion.cantidadLineas} productos</strong> (
                {resumenSeleccion.totalArticulos} unidades)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Subtotal: {dinero(resumenSeleccion.subtotal, simboloMoneda)} + IVA (15%):{" "}
                {dinero(resumenSeleccion.iva, simboloMoneda)}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total a Facturar
              </span>
              <span className="text-base font-black text-slate-900">
                {dinero(resumenSeleccion.total, simboloMoneda)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCotizacionSeleccionada(null)}
              className="btn btn-linea h-9 px-3 text-xs font-bold"
            >
              ← Volver a cotizaciones
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={cerrarYLimpiar}
                className="btn btn-linea h-9 px-4 text-xs font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleImportar}
                disabled={resumenSeleccion.cantidadLineas === 0}
                className="btn btn-amarillo h-9 px-5 text-xs font-bold gap-1.5 shadow-xs disabled:opacity-40"
              >
                <ShoppingCart size={14} />
                Importar al Mostrador ({resumenSeleccion.cantidadLineas})
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
