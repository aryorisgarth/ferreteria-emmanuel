import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Printer,
  Receipt,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import {
  aceptarCotizacionAction,
  borrarCotizacionAction,
  enviarCotizacionAction,
  rechazarCotizacionAction,
  facturarCotizacionAction,
} from "@/app/actions";
import { FormularioConfirmar } from "@/components/forms/FormularioConfirmar";
import { BotonImprimir } from "@/components/documentos/Imprimir";
import { Membrete } from "@/components/documentos/Membrete";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { dinero, etiquetaUnidad, fechaCorta, hoyISO, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";
import { obtenerSesionActual } from "@/lib/auth";
import { HistorialVersionesCotizacion } from "@/components/cotizaciones/HistorialVersionesCotizacion";
import { PanelAutorizacionPrecios } from "@/components/cotizaciones/PanelAutorizacionPrecios";
import { FormularioNuevaVersion } from "@/components/cotizaciones/FormularioNuevaVersion";

export const metadata = { title: "Detalle de Cotización" };

export default async function CotizacionDetalle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [detalle, config, catalogo, sesion] = await Promise.all([
    api.cotizacion(id),
    obtenerConfiguracion(),
    api.catalogo(),
    obtenerSesionActual(),
  ]);

  if (!detalle) notFound();

  const { cotizacion, items, subtotal, isv, total } = detalle;
  const abierta = cotizacion.estado !== "FACTURADA";
  const simbolo = config.moneda.simbolo;
  const esPropietario = sesion?.rol === "ADMINISTRADOR";

  // Enlace para WhatsApp
  const resumenItems = items.map((it) => `- ${numero(it.cantidad)}x ${it.nombre}: ${simbolo} ${numero(it.importe)}`).join("%0A");
  const textoWhatsApp = `*${encodeURIComponent(config.empresa.nombre)}*%0A*Cotización:* ${cotizacion.numero}%0A*Cliente:* ${encodeURIComponent(cotizacion.cliente)}%0A*Fecha:* ${cotizacion.fecha}%0A-----------------------%0A${resumenItems}%0A-----------------------%0A*Total:* ${simbolo} ${numero(total)}%0A*Validez:* 15 días.%0A%0A_Precios sujetos a cambio sin previo aviso._`;
  const urlWhatsApp = `https://wa.me/?text=${textoWhatsApp}`;

  return (
    <PageDocument
      seccion="Cotización Comercial"
      titulo={`Cotización ${cotizacion.numero}`}
      volverUrl="/cotizaciones"
      acciones={
        <div className="flex items-center gap-2">
          <BotonImprimir>
            <Printer size={15} />
            Imprimir Hoja Membretada
          </BotonImprimir>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50 no-print"
          >
            <Share2 size={15} />
            WhatsApp
          </a>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* Documento Formal con Membrete Corporativo */}
      <Membrete titulo="COTIZACIÓN FORMAL" correlativo={cotizacion.numero} variante="quote" empresa={config.empresa}>
        <div className="flex flex-wrap justify-between gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Datos del Cliente</p>
            <p className="mt-1 text-base sm:text-lg font-bold text-slate-900">{cotizacion.cliente}</p>
            {cotizacion.notas && (
              <p className="mt-1 text-xs text-slate-500 max-w-md bg-slate-50 p-2 rounded-lg border border-slate-100">
                {cotizacion.notas}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha y Términos</p>
            <p className="mt-1 font-semibold text-slate-800">Fecha: {fechaCorta(cotizacion.fecha)}</p>
            <p className="text-xs text-slate-500">Validez: 15 días</p>
            <div className="mt-2">
              <span className="inline-block rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-900 text-xs uppercase tracking-wider">
                {cotizacion.estado}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Artículos Cotizados */}
        <div className="overflow-x-auto mt-6">
          <table className="tabla w-full min-w-[550px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-white py-3 px-3">No.</th>
                <th className="text-white py-3 px-3">Descripción del Material</th>
                <th className="text-white py-3 px-3 text-center">Cant.</th>
                <th className="text-white py-3 px-3 text-right">Precio Unit. ({simbolo})</th>
                <th className="text-white py-3 px-3 text-right">Importe ({simbolo})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item, i) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono text-slate-400">{i + 1}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-slate-900">{item.nombre}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Código: {item.codigo} · {etiquetaUnidad(item.unidadMedida)}
                      {item.observacion ? ` · ${item.observacion}` : ""}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">{numero(item.cantidad)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">{dinero(item.precio, simbolo)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {dinero(item.importe, simbolo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cuadro de Totales */}
        <div className="ml-auto mt-5 max-w-xs space-y-1.5 text-xs">
          <p className="flex justify-between text-slate-600">
            <span>Subtotal Neto</span>
            <span className="font-mono font-bold">{dinero(subtotal, simbolo)}</span>
          </p>
          <p className="flex justify-between text-slate-600">
            <span>I.V.A. ({config.impuesto.porcentaje}%)</span>
            <span className="font-mono font-bold">{dinero(isv, simbolo)}</span>
          </p>
          <p className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-extrabold text-slate-900">
            <span>Total Cotizado</span>
            <span className="font-mono text-lg text-amber-600">{dinero(total, simbolo)}</span>
          </p>
        </div>

        {/* Términos y Condiciones */}
        <div className="mt-8 border-t border-slate-100 pt-4 text-[11px] text-slate-500 leading-relaxed print:text-slate-700">
          <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">Condiciones Comerciales:</p>
          <p>{config.ventas.terminosCotizacion}</p>
          <p className="mt-1">
            Esta cotización no constituye reserva de mercadería ni descuenta existencia en inventario hasta ser formalizada y facturada.
          </p>
        </div>
      </Membrete>

      {/* Barra de Acciones del Flujo de Venta */}
      <div className="no-print mt-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {cotizacion.facturaId && (
            <Link className="btn btn-azul h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href={`/facturas/${cotizacion.facturaId}`}>
              <Receipt size={15} />
              Ver Factura Emitida
            </Link>
          )}

          {abierta && (
            <>
              {cotizacion.estado === "BORRADOR" && (
                <form action={enviarCotizacionAction}>
                  <input type="hidden" name="id" value={cotizacion.id} />
                  <button className="btn btn-linea h-10 px-4 text-xs font-bold gap-1.5">
                    <Send size={14} className="text-blue-600" />
                    Marcar como Enviada
                  </button>
                </form>
              )}

              {cotizacion.estado !== "ACEPTADA" && (
                <form action={aceptarCotizacionAction}>
                  <input type="hidden" name="id" value={cotizacion.id} />
                  <button className="btn btn-linea h-10 px-4 text-xs font-bold gap-1.5 border-emerald-400 text-emerald-800 hover:bg-emerald-50">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Marcar Aceptada
                  </button>
                </form>
              )}

              {cotizacion.estado !== "RECHAZADA" && (
                <form action={rechazarCotizacionAction}>
                  <input type="hidden" name="id" value={cotizacion.id} />
                  <button className="btn btn-linea h-10 px-3 text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50">
                    Rechazar
                  </button>
                </form>
              )}

              {cotizacion.estado !== "RECHAZADA" && cotizacion.estado !== "VENCIDA" && (
                <form action={facturarCotizacionAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={cotizacion.id} />
                  <input type="hidden" name="fecha" value={hoyISO()} />
                  <select
                    name="politicaPrecios"
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700"
                    title="Política de precios al facturar"
                  >
                    <option value="CONSERVAR">Respetar Precios Cotizados</option>
                    <option value="ACTUALIZAR">Actualizar a Precios Vigentes</option>
                  </select>
                  <button
                    type="submit"
                    className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-amber-500/20"
                  >
                    <Receipt size={15} />
                    Facturar y Descargar Stock
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {abierta && (
          <FormularioConfirmar
            action={borrarCotizacionAction}
            mensaje="¿Está seguro de eliminar esta cotización?"
          >
            <input type="hidden" name="id" value={cotizacion.id} />
            <button className="btn btn-rojo h-10 px-3 text-xs font-bold gap-1">
              <Trash2 size={14} />
              Eliminar
            </button>
          </FormularioConfirmar>
        )}
      </div>

      {/* SECCIONES COMERCIALES Y DE GOBERNANZA — FASE 2.2 */}
      <div className="no-print mt-6 space-y-6">
        {/* 1. Panel de Autorización de Precios Negociados */}
        <PanelAutorizacionPrecios
          cotizacion={cotizacion}
          items={items}
          catalogoProductos={catalogo}
          simboloMoneda={simbolo}
          esPropietario={esPropietario}
          usuarioActual={sesion}
        />

        {/* 2. Historial de Versiones y Trazabilidad Comercial */}
        <HistorialVersionesCotizacion
          cotizacionActual={cotizacion}
          simboloMoneda={simbolo}
        />

        {/* 3. Preparación de Nueva Versión Inmutable (V2, V3...) */}
        <FormularioNuevaVersion
          cotizacion={cotizacion}
          items={items}
          catalogoProductos={catalogo}
          simboloMoneda={simbolo}
          esPropietario={esPropietario}
          usuarioActual={sesion}
        />
      </div>
    </PageDocument>
  );
}
