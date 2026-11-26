"use client";

import { useState, useMemo } from "react";
import {
  FilePlus2,
  GitBranch,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileText,
} from "lucide-react";
import { dinero, numero, etiquetaUnidad } from "@/lib/format";
import type { Cotizacion, LineaComercial, ProductoVista } from "@/lib/types";
import { generarBorradorNuevaVersion, redondearMoneda, redondearCantidad } from "@/lib/domain/cotizaciones/pure";
import type { CotizacionVersionada, ResumenSaldosCotizacion, LineaCotizadaDominio } from "@/lib/domain/cotizaciones/types";
import { Modal } from "@/components/ui/Modal";

interface FormularioNuevaVersionProps {
  cotizacion: Cotizacion;
  items: Array<LineaComercial & {
    nombre?: string;
    codigo?: string;
    costoUnitario?: number;
    cantidadFacturada?: number;
    cantidadPendiente?: number;
  }>;
  catalogoProductos: ProductoVista[];
  simboloMoneda?: string;
  esPropietario: boolean;
  usuarioActual?: {
    usuario: string;
    nombre: string;
    rol: string;
  } | null;
}

interface LineaEdicionVersion {
  idOriginal: string;
  productoId: string;
  nombre: string;
  codigo: string;
  unidadMedida: LineaComercial["unidadMedida"];
  cantidadOriginal: number;
  cantidadFacturada: number;
  cantidadPendienteActual: number;
  nuevaCantidadPendiente: number;
  precioOriginal: number;
  nuevoPrecio: number;
  observacion: string;
}

export function FormularioNuevaVersion({
  cotizacion,
  items,
  catalogoProductos,
  simboloMoneda = "C$",
  esPropietario,
  usuarioActual,
}: FormularioNuevaVersionProps) {
  const versionActualNum = cotizacion.version || 1;
  const versionSiguienteNum = versionActualNum + 1;
  const esSustituida = cotizacion.estado === "SUSTITUIDA" || cotizacion.esVersionActual === false;

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [motivoVersion, setMotivoVersion] = useState("Ajuste comercial de precios y cantidades pendientes acordado con cliente.");
  const [modalResumenAbierto, setModalResumenAbierto] = useState(false);
  const [borradorGenerado, setBorradorGenerado] = useState<any | null>(null);

  // Inicializar líneas de edición únicamente sobre saldos pendientes
  const [lineasEdicion, setLineasEdicion] = useState<LineaEdicionVersion[]>(() => {
    return items.map((it) => {
      const facturada = it.cantidadFacturada || (cotizacion.estado === "FACTURADA" ? it.cantidad : 0);
      const pendiente =
        it.cantidadPendiente !== undefined
          ? it.cantidadPendiente
          : cotizacion.estado === "FACTURADA"
          ? 0
          : Math.max(0, it.cantidad - facturada);

      return {
        idOriginal: it.id,
        productoId: it.productoId,
        nombre: it.nombre || `Producto (${it.productoId})`,
        codigo: it.codigo || "---",
        unidadMedida: it.unidadMedida,
        cantidadOriginal: it.cantidad,
        cantidadFacturada: facturada,
        cantidadPendienteActual: pendiente,
        nuevaCantidadPendiente: pendiente, // Por defecto conserva el saldo pendiente
        precioOriginal: it.precio,
        nuevoPrecio: it.precio,
        observacion: it.observacion || "",
      };
    });
  });

  // Cálculos comparativos en tiempo real
  const comparativa = useMemo(() => {
    let subtotalActualPendiente = 0;
    let subtotalNuevaVersion = 0;

    lineasEdicion.forEach((l) => {
      subtotalActualPendiente += l.cantidadPendienteActual * l.precioOriginal;
      subtotalNuevaVersion += l.nuevaCantidadPendiente * l.nuevoPrecio;
    });

    const ivaActual = redondearMoneda(subtotalActualPendiente * 0.15);
    const totalActual = redondearMoneda(subtotalActualPendiente + ivaActual);

    const ivaNuevo = redondearMoneda(subtotalNuevaVersion * 0.15);
    const totalNuevo = redondearMoneda(subtotalNuevaVersion + ivaNuevo);

    const deltaSubtotal = redondearMoneda(subtotalNuevaVersion - subtotalActualPendiente);
    const deltaTotal = redondearMoneda(totalNuevo - totalActual);

    return {
      subtotalActualPendiente: redondearMoneda(subtotalActualPendiente),
      totalActual,
      subtotalNuevaVersion: redondearMoneda(subtotalNuevaVersion),
      totalNuevo,
      deltaSubtotal,
      deltaTotal,
    };
  }, [lineasEdicion]);

  function actualizarLinea(idOriginal: string, campo: "nuevaCantidadPendiente" | "nuevoPrecio" | "observacion", valor: any) {
    setLineasEdicion((prev) =>
      prev.map((l) => {
        if (l.idOriginal !== idOriginal) return l;
        return {
          ...l,
          [campo]: valor,
        };
      })
    );
  }

  function prepararBorrador() {
    // 1. Validar que no sea una versión sustituida
    if (esSustituida) {
      alert("No se puede versionar una cotización que ya fue sustituida.");
      return;
    }

    // 2. Filtrar renglones que conserven cantidad positiva
    const lineasActivas = lineasEdicion.filter((l) => l.nuevaCantidadPendiente > 0);
    if (lineasActivas.length === 0) {
      alert("La nueva versión debe contener al menos un artículo con cantidad pendiente mayor a 0.");
      return;
    }

    // 3. Generar identificadores únicos nuevos que JAMÁS coincidan con los históricos
    const idsHistoricos = new Set(lineasEdicion.map((l) => l.idOriginal));
    const nuevosItemsPendientes = lineasActivas.map((l, index) => {
      const nuevoIdUnico = `cot_item_v${versionSiguienteNum}_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`;
      if (idsHistoricos.has(nuevoIdUnico)) {
        throw new Error("Colisión de ID detectada.");
      }
      return {
        id: nuevoIdUnico,
        productoId: l.productoId,
        cantidad: l.nuevaCantidadPendiente,
        precio: l.nuevoPrecio,
        unidadMedida: l.unidadMedida,
        observacion: l.observacion,
      };
    });

    // 4. Adaptar modelos para invocar la función pura de dominio
    const versionActualAdaptada: CotizacionVersionada = {
      id: cotizacion.id,
      numero: cotizacion.numero,
      cliente: cotizacion.cliente,
      clienteId: cotizacion.clienteId,
      fecha: cotizacion.fecha,
      estado: cotizacion.estado,
      notas: cotizacion.notas,
      creadoPor: cotizacion.creadoPor,
      facturaId: cotizacion.facturaId,
      version: versionActualNum,
      cotizacionRaizId: cotizacion.cotizacionRaizId || cotizacion.id,
      esVersionActual: true,
      items: items.map((it) => ({
        id: it.id,
        cotizacionId: cotizacion.id,
        productoId: it.productoId,
        cantidad: it.cantidad,
        precio: it.precio,
        unidadMedida: it.unidadMedida,
        observacion: it.observacion,
      })),
    };

    const saldosSimulados: ResumenSaldosCotizacion = {
      cotizacionId: cotizacion.id,
      cotizacionNumero: cotizacion.numero,
      version: versionActualNum,
      esVersionActual: true,
      estado: cotizacion.estado,
      items: items.map((it) => {
        const facturada = it.cantidadFacturada || 0;
        const pendiente = it.cantidadPendiente !== undefined ? it.cantidadPendiente : Math.max(0, it.cantidad - facturada);
        return {
          id: it.id,
          cotizacionId: cotizacion.id,
          productoId: it.productoId,
          cantidad: it.cantidad,
          precio: it.precio,
          unidadMedida: it.unidadMedida,
          cantidadFacturada: facturada,
          cantidadPendiente: pendiente,
          subtotalLineaOriginal: it.cantidad * it.precio,
          subtotalLineaFacturado: facturada * it.precio,
          subtotalLineaPendiente: pendiente * it.precio,
          estaCompletamenteFacturada: pendiente <= 0,
        };
      }),
      subtotalOriginal: cotizacion.subtotal || 0,
      subtotalFacturado: 0,
      subtotalPendiente: comparativa.subtotalActualPendiente,
      totalOriginal: cotizacion.total || 0,
      totalFacturado: 0,
      totalPendiente: comparativa.totalActual,
      estaTotalmenteFacturada: false,
      estaParcialmenteFacturada: false,
      tieneSaldosPendientes: true,
    };

    const resultado = generarBorradorNuevaVersion(versionActualAdaptada, saldosSimulados, {
      nuevoId: `cot_${Date.now()}_v${versionSiguienteNum}`,
      nuevoNumero: `${cotizacion.numero.replace(/-V\d+$/, "")}-V${versionSiguienteNum}`,
      fecha: new Date().toISOString().split("T")[0],
      usuario: usuarioActual?.usuario || "admin",
      motivo: motivoVersion,
      nuevosItemsPendientes,
    });

    setBorradorGenerado(resultado);
    setModalResumenAbierto(true);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* Encabezado del Preparador de Versiones */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-black">
            <GitBranch size={19} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Preparación de Nueva Versión Inmutable (V{versionSiguienteNum})
              <span className="rounded-full bg-purple-100 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                Basada en saldos de V{versionActualNum}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Permite renegociar únicamente saldos pendientes de entrega sin afectar facturas emitidas ni alterar la versión previa.
            </p>
          </div>
        </div>

        <div>
          {esSustituida ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs text-slate-700 font-bold">
              <Lock size={14} />
              Versión Sustituida (No Editable)
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setPanelAbierto(!panelAbierto)}
              className="btn btn-amarillo h-9 px-4 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <FilePlus2 size={15} />
              <span>{panelAbierto ? "Ocultar Formulario V" + versionSiguienteNum : "Preparar Versión V" + versionSiguienteNum}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bloqueo si es una versión ya sustituida */}
      {esSustituida && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-bold">Edición Bloqueada por Regla de Inmutabilidad</p>
            <p className="text-[11px] text-rose-800 mt-0.5">
              Esta cotización se encuentra en estado <strong>SUSTITUIDA</strong>. Por integridad histórica, no es
              posible generar una nueva versión a partir de un documento que ya no es la versión vigente.
            </p>
          </div>
        </div>
      )}

      {/* Formulario de Nueva Versión */}
      {panelAbierto && !esSustituida && (
        <div className="space-y-4 pt-2">
          {/* Alerta de Compromisos Pendientes */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 text-xs text-purple-950 flex items-start gap-2.5">
            <Info size={17} className="shrink-0 text-purple-700 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Reglas de Versionado Comercial (Fase 2.2)</p>
              <p className="text-purple-900 text-[11px] leading-relaxed">
                1. Las cantidades ya facturadas permanecen <strong>congeladas e inmutables</strong>.<br />
                2. Los ajustes de precio y volumen aplican <strong>exclusivamente sobre las cantidades pendientes</strong>.<br />
                3. La versión actual (V{versionActualNum}) pasará a estado <code>SUSTITUIDA</code> cuando se formalice
                la nueva versión (V{versionSiguienteNum}) con identificadores de línea completamente nuevos.
              </p>
            </div>
          </div>

          {/* Motivo del Ajuste */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Motivo o Justificación Comercial del Nuevo Versionado
            </label>
            <input
              type="text"
              value={motivoVersion}
              onChange={(e) => setMotivoVersion(e.target.value)}
              placeholder="Ej. Descuento adicional por volumen acordado con el cliente..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
            />
          </div>

          {/* Tabla de Artículos Pendientes para Ajuste */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3 text-center">Facturado (Fijo)</th>
                  <th className="py-2.5 px-3 text-center">Pendiente Actual</th>
                  <th className="py-2.5 px-3 text-center w-32">Nueva Cantidad</th>
                  <th className="py-2.5 px-3 text-right">Precio Actual</th>
                  <th className="py-2.5 px-3 text-right w-36">Nuevo Precio</th>
                  <th className="py-2.5 px-3 text-right">Nuevo Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {lineasEdicion.map((linea) => {
                  const importeNuevoLinea = redondearMoneda(linea.nuevaCantidadPendiente * linea.nuevoPrecio);
                  const cambioCantidad = linea.nuevaCantidadPendiente - linea.cantidadPendienteActual;
                  const cambioPrecio = linea.nuevoPrecio - linea.precioOriginal;

                  return (
                    <tr key={linea.idOriginal} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{linea.nombre}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {linea.codigo} · {etiquetaUnidad(linea.unidadMedida)}
                        </p>
                      </td>

                      {/* Facturado Fijo */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-700 bg-purple-50/30">
                        {numero(linea.cantidadFacturada)}
                      </td>

                      {/* Pendiente Actual */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                        {numero(linea.cantidadPendienteActual)}
                      </td>

                      {/* Input Nueva Cantidad Pendiente */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={linea.nuevaCantidadPendiente}
                          onChange={(e) =>
                            actualizarLinea(
                              linea.idOriginal,
                              "nuevaCantidadPendiente",
                              Math.max(0, Number(e.target.value) || 0)
                            )
                          }
                          className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-center font-mono text-xs font-bold text-slate-900 outline-none focus:border-brand-yellow"
                        />
                        {cambioCantidad !== 0 && (
                          <p className={`text-[10px] font-mono mt-0.5 ${cambioCantidad > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {cambioCantidad > 0 ? `+${numero(cambioCantidad)}` : numero(cambioCantidad)}
                          </p>
                        )}
                      </td>

                      {/* Precio Actual */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {dinero(linea.precioOriginal, simboloMoneda)}
                      </td>

                      {/* Input Nuevo Precio Negociado */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[11px] text-slate-400">{simboloMoneda}</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={linea.nuevoPrecio}
                            onChange={(e) =>
                              actualizarLinea(
                                linea.idOriginal,
                                "nuevoPrecio",
                                Math.max(0, Number(e.target.value) || 0)
                              )
                            }
                            className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right font-mono text-xs font-bold text-slate-900 outline-none focus:border-brand-yellow"
                          />
                        </div>
                        {cambioPrecio !== 0 && (
                          <p className={`text-[10px] font-mono mt-0.5 text-right ${cambioPrecio > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                            {cambioPrecio > 0 ? `+${dinero(cambioPrecio, simboloMoneda)}` : dinero(cambioPrecio, simboloMoneda)}
                          </p>
                        )}
                      </td>

                      {/* Nuevo Importe */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {dinero(importeNuevoLinea, simboloMoneda)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cuadro Comparativo de Diferencias de Totales */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Saldo Pendiente V{versionActualNum}</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-700">
                {dinero(comparativa.totalActual, simboloMoneda)}
              </p>
              <p className="text-[11px] text-slate-500">Subtotal: {dinero(comparativa.subtotalActualPendiente, simboloMoneda)}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Nueva Propuesta V{versionSiguienteNum}</p>
              <p className="mt-1 font-mono text-base font-extrabold text-purple-900">
                {dinero(comparativa.totalNuevo, simboloMoneda)}
              </p>
              <p className="text-[11px] text-purple-700">Subtotal: {dinero(comparativa.subtotalNuevaVersion, simboloMoneda)}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Variación Neta</p>
              <p className={`mt-1 font-mono text-sm font-extrabold ${comparativa.deltaTotal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {comparativa.deltaTotal >= 0 ? `+${dinero(comparativa.deltaTotal, simboloMoneda)}` : dinero(comparativa.deltaTotal, simboloMoneda)}
              </p>
              <p className="text-[11px] text-slate-500">Diferencia proyectada</p>
            </div>
          </div>

          {/* Botón para Generar Borrador */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={prepararBorrador}
              className="btn btn-amarillo h-11 px-6 text-xs font-bold gap-2 shadow-md shadow-amber-500/20"
            >
              <FilePlus2 size={16} />
              <span>Generar y Revisar Borrador Inmutable V{versionSiguienteNum}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Resumen y Validación del Borrador Preparado */}
      <Modal
        abierto={modalResumenAbierto}
        alCerrar={() => setModalResumenAbierto(false)}
        titulo={`Borrador de Versión V${versionSiguienteNum} Preparado`}
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-emerald-950 flex items-start gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-900">Borrador Validado en Memoria por Reglas de Dominio</p>
              <p className="leading-relaxed">
                Se ha generado con éxito la estructura inmutable de la nueva versión{" "}
                <strong>{borradorGenerado?.nuevaVersion?.numero}</strong>. Los identificadores de cada línea son
                100% nuevos y no colisionan con los registros históricos.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-100 p-3 space-y-1.5 font-mono text-[11px]">
            <p><strong>Versión Sustituida:</strong> V{versionActualNum} ({cotizacion.numero}) → Estado: SUSTITUIDA</p>
            <p><strong>Nueva Versión:</strong> V{versionSiguienteNum} ({borradorGenerado?.nuevaVersion?.numero}) → Estado: BORRADOR</p>
            <p><strong>Total Nueva Versión:</strong> {dinero(comparativa.totalNuevo, simboloMoneda)}</p>
            <p><strong>Líneas Administradas:</strong> {borradorGenerado?.nuevaVersion?.items?.length || 0} ítems pendientes</p>
            <p><strong>Motivo:</strong> {motivoVersion}</p>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 text-[11px] flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 text-amber-600 mt-0.5" />
            <p>
              <strong>Aviso de Fase 2.2:</strong> La persistencia en la base de datos PostgreSQL se implementará en la
              Fase 3 con el servicio transaccional. Por ahora, este borrador opera de manera demostrativa y segura sin
              efectuar escrituras en la base de datos.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setModalResumenAbierto(false)}
              className="btn btn-amarillo h-9 px-4 text-xs font-bold"
            >
              Cerrar Resumen
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
