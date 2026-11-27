import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Printer,
  Receipt,
  Share2,
  Undo2,
  XCircle,
} from "lucide-react";
import { anularFacturaAction, pagarFacturaAction } from "@/app/actions";
import { FormularioConfirmar } from "@/components/forms/FormularioConfirmar";
import { BotonImprimir } from "@/components/documentos/Imprimir";
import { Membrete } from "@/components/documentos/Membrete";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { dinero, etiquetaFactura, etiquetaPago, etiquetaUnidad, fechaCorta, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Factura Electrónica" };

export default async function FacturaDetalle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [detalle, config, devoluciones] = await Promise.all([
    api.factura(id),
    obtenerConfiguracion(),
    api.devolucionesCliente({ facturaId: id }),
  ]);

  if (!detalle) notFound();

  const { factura, cotizacion, items, subtotal, isv, total } = detalle;
  const simbolo = config.moneda.simbolo;

  // Enlace para WhatsApp
  const resumenItems = items.map((it) => `- ${numero(it.cantidad)}x ${it.nombre}: ${simbolo} ${numero(it.importe)}`).join("%0A");
  const textoWhatsApp = `*${encodeURIComponent(config.empresa.nombre)}*%0A*Factura:* ${factura.numero}%0A*Cliente:* ${encodeURIComponent(factura.cliente)}%0A*Fecha:* ${factura.fecha}%0A-----------------------%0A${resumenItems}%0A-----------------------%0A*Total:* ${simbolo} ${numero(total)}%0A*Estado:* ${factura.estado}%0A%0A_${config.empresa.pieFactura}_`;
  const urlWhatsApp = `https://wa.me/?text=${textoWhatsApp}`;

  return (
    <PageDocument
      seccion="Facturación y Ventas"
      titulo={`Factura ${factura.numero}`}
      volverUrl="/facturas"
      acciones={
        <div className="flex items-center gap-2">
          <BotonImprimir>
            <Printer size={15} />
            Imprimir Factura
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

      <Membrete titulo="FACTURA OFICIAL" correlativo={factura.numero} variante="invoice" empresa={config.empresa}>
        <div className="flex flex-wrap justify-between gap-3 text-xs sm:text-sm print:text-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente / Razón Social</p>
            <p className="mt-0.5 text-base sm:text-lg font-bold text-slate-900 print:text-sm">{factura.cliente}</p>
            {factura.notas && (
              <p className="mt-1 text-xs text-slate-500 max-w-md bg-slate-50 p-1.5 rounded-lg border border-slate-100 print:bg-white print:p-0 print:border-none">
                {factura.notas}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detalles Fiscales</p>
            <p className="mt-0.5 font-semibold text-slate-800">Fecha: {fechaCorta(factura.fecha)}</p>
            <p className="text-xs text-slate-600 font-medium">Condición: {etiquetaPago(factura.formaPago)}</p>
            <div className="mt-1">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 font-bold text-[11px] uppercase tracking-wider ${factura.estado === "PAGADA"
                  ? "bg-emerald-100 text-emerald-900"
                  : factura.estado === "ANULADA"
                    ? "bg-rose-100 text-rose-900"
                    : "bg-amber-100 text-amber-900"
                  }`}
              >
                {etiquetaFactura(factura.estado)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Artículos Facturados */}
        <div className="overflow-x-auto mt-4 print:mt-2.5">
          <table className="tabla w-full min-w-[550px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-white py-2 px-2.5 text-xs font-bold">No.</th>
                <th className="text-white py-2 px-2.5 text-xs font-bold">Descripción del Material</th>
                <th className="text-white py-2 px-2.5 text-center text-xs font-bold">Cant.</th>
                <th className="text-white py-2 px-2.5 text-right text-xs font-bold">Precio Unit. ({simbolo})</th>
                <th className="text-white py-2 px-2.5 text-right text-xs font-bold">Total ({simbolo})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item, i) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2.5 font-mono text-slate-400">{i + 1}</td>
                  <td className="py-2 px-2.5">
                    <p className="font-bold text-slate-900">{item.nombre}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      {item.codigo} · {etiquetaUnidad(item.unidadMedida)}
                      {item.observacion ? ` · ${item.observacion}` : ""}
                    </p>
                  </td>
                  <td className="py-2 px-2.5 text-center font-bold text-slate-800">{numero(item.cantidad)}</td>
                  <td className="py-2 px-2.5 text-right font-mono text-slate-700">{dinero(item.precio, simbolo)}</td>
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                    {dinero(item.importe, simbolo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen Fiscal */}
        <div className="ml-auto mt-3.5 max-w-xs space-y-1 text-xs">
          <p className="flex justify-between text-slate-600">
            <span>Subtotal Neto</span>
            <span className="font-mono font-bold">{dinero(subtotal, simbolo)}</span>
          </p>
          <p className="flex justify-between text-slate-600">
            <span>I.V.A. ({config.impuesto.porcentaje}%)</span>
            <span className="font-mono font-bold">{dinero(isv, simbolo)}</span>
          </p>
          <p className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-sm font-extrabold text-slate-900">
            <span>Total Factura</span>
            <span className="font-mono text-base text-emerald-700">{dinero(total, simbolo)}</span>
          </p>
        </div>

        {/* Auditoría y Kárdex (Oculto estrictamente al imprimir factura cliente) */}
        <div className="no-print print:hidden mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <p>
            {factura.stockAplicado
              ? "✓ Venta descargada del inventario y registrada en el kárdex general."
              : "⚠ Existencia pendiente de sincronizar."}
            {cotizacion ? ` Generada a partir de Cotización ${cotizacion.numero}.` : ""}
          </p>
          <p className="font-semibold text-slate-600">Usuario cajero: {factura.creadoPor}</p>
        </div>

        {/* Pie de Garantía Oficial */}
        <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200/60 p-2.5 text-center text-xs text-slate-600 print:bg-white print:border-slate-300 print:text-[11px] print:p-2">
          {config.empresa.pieFactura}
        </div>

        {/* Firmas de Conformidad para Impresión */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-4 px-6 text-center text-xs text-slate-700">
          <div>
            <div className="border-t border-slate-800 w-48 mx-auto pt-1 font-bold">Entregado / Despachado</div>
            <div className="text-[10px] text-slate-500">Bodega & Facturación</div>
          </div>
          <div>
            <div className="border-t border-slate-800 w-48 mx-auto pt-1 font-bold">Recibí Conforme</div>
            <div className="text-[10px] text-slate-500">{factura.cliente}</div>
          </div>
        </div>
      </Membrete>

      {/* Historial de Devoluciones de Clientes (si existen) */}
      {devoluciones.length > 0 && (
        <div className="no-print mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Undo2 size={16} className="text-amber-600" />
              Devoluciones Registradas de esta Factura ({devoluciones.length})
            </h3>
            <span className="text-xs text-slate-500 font-mono">Stock reintegrado físicamente</span>
          </div>

          <div className="overflow-x-auto">
            <table className="tabla w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="py-2 px-3">No. Devolución</th>
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Motivo</th>
                  <th className="py-2 px-3">Responsable</th>
                  <th className="py-2 px-3">Reintegro</th>
                  <th className="py-2 px-3 text-right">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {devoluciones.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-bold text-amber-700">{d.numero}</td>
                    <td className="py-2 px-3 text-slate-600">{fechaCorta(d.fecha)}</td>
                    <td className="py-2 px-3 font-sans text-slate-800">{d.motivo}</td>
                    <td className="py-2 px-3 font-sans text-slate-600">{d.responsable}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700">
                        {d.metodoReintegro === "EFECTIVO" ? "Efectivo (Caja)" : "Nota de Crédito"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{dinero(d.totalReintegro, simbolo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botones de Gestión */}
      <div className="no-print mt-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {factura.formaPago === "CREDITO" && factura.estado === "EMITIDA" && (
            <Link
              href={`/cobranza?tab=cuentas_cobrar&q=${encodeURIComponent(factura.numero)}`}
              className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-amber-500/20"
            >
              <DollarSign size={15} />
              Registrar Abono a Crédito
            </Link>
          )}

          {factura.estado === "EMITIDA" && factura.formaPago !== "CREDITO" && (
            <form action={pagarFacturaAction}>
              <input type="hidden" name="id" value={factura.id} />
              <button className="btn btn-amarillo h-10 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-amber-500/20">
                <CheckCircle2 size={15} />
                Marcar como Cobrada / Pagada
              </button>
            </form>
          )}

          {factura.estado !== "ANULADA" && (
            <Link
              className="btn btn-linea h-10 px-4 text-xs font-bold gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
              href={`/facturas/${factura.id}/devolucion`}
            >
              <Undo2 size={15} />
              Registrar Devolución
            </Link>
          )}

          {cotizacion && (
            <Link className="btn btn-linea h-10 px-4 text-xs font-bold gap-1.5" href={`/cotizaciones/${cotizacion.id}`}>
              <Receipt size={14} />
              Ver Cotización Origen
            </Link>
          )}
        </div>

        {factura.estado !== "ANULADA" && (
          <FormularioConfirmar
            action={anularFacturaAction}
            mensaje="¿Desea anular esta factura? Los artículos salidos se reintegrarán automáticamente al inventario."
          >
            <input type="hidden" name="id" value={factura.id} />
            <button className="btn btn-rojo h-10 px-4 text-xs font-bold gap-1.5">
              <XCircle size={15} />
              Anular Factura y Devolver Stock
            </button>
          </FormularioConfirmar>
        )}
      </div>
    </PageDocument>
  );
}
