import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Printer,
  Truck,
  XCircle,
  CreditCard,
  Undo2,
  Calendar,
  FileText,
} from "lucide-react";
import { anularCompraAction, crearAbonoCompraAction } from "@/app/actions";
import { FormularioConfirmar } from "@/components/forms/FormularioConfirmar";
import { BotonImprimir } from "@/components/documentos/Imprimir";
import { Membrete } from "@/components/documentos/Membrete";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { dinero, etiquetaUnidad, fechaCorta, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Detalle de Compra de Mercadería" };

export default async function CompraPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [detalle, config] = await Promise.all([
    api.compra(id),
    obtenerConfiguracion(),
  ]);

  if (!detalle) notFound();

  const { compra, items, total, subtotal, descuento, isv, pagos, devoluciones, recepcion, pedido } = detalle;
  const simbolo = config.moneda.simbolo;

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo={`Compra ${compra.numero}`}
      volverUrl="/compras"
      acciones={
        <div className="flex items-center gap-2">
          {!compra.anulada && (
            <Link
              className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5 no-print"
              href={`/compras/devoluciones/nueva?compraId=${compra.id}`}
            >
              <Undo2 size={15} />
              Devolver a Proveedor
            </Link>
          )}
          <BotonImprimir>
            <Printer size={15} />
            Imprimir Comprobante
          </BotonImprimir>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      <Membrete titulo="COMPROBANTE DE COMPRA" correlativo={compra.numero} variante="invoice" empresa={config.empresa}>
        <div className="flex flex-wrap justify-between gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proveedor / Distribuidor</p>
            <p className="mt-1 text-base sm:text-lg font-bold text-slate-900">{compra.proveedor}</p>
            {compra.facturaProveedor && (
              <p className="mt-1 font-mono text-xs font-bold text-slate-700">
                Factura del Proveedor: <span className="text-amber-700">{compra.facturaProveedor}</span>
              </p>
            )}
            {compra.notas && (
              <p className="mt-1 text-xs text-slate-500 max-w-md bg-slate-50 p-2 rounded-lg border border-slate-100">
                {compra.notas}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Condición Comercial</p>
            <p className="mt-1 font-semibold text-slate-800">Fecha Ingreso: {fechaCorta(compra.fecha)}</p>
            <div className="mt-1 text-xs">
              <span className="font-bold text-slate-600">Condición: </span>
              <span className="font-bold text-slate-900">
                {compra.condicionPago === "CREDITO"
                  ? `Crédito (${compra.diasCredito || 30} días)`
                  : "Contado"}
              </span>
            </div>
            {compra.condicionPago === "CREDITO" && compra.fechaVencimiento && (
              <p className="text-xs font-medium text-rose-600">
                Vence: {fechaCorta(compra.fechaVencimiento)}
              </p>
            )}
            <div className="mt-2">
              <span
                className={`inline-block rounded-full px-3 py-1 font-bold text-xs uppercase tracking-wider ${
                  compra.anulada ? "bg-rose-100 text-rose-900" : "bg-emerald-100 text-emerald-900"
                }`}
              >
                {compra.anulada
                  ? "Compra Anulada"
                  : compra.recepcionId
                  ? "Stock Aplicado en Recepción"
                  : "Stock Aplicado en Kárdex"}
              </span>
            </div>
          </div>
        </div>

        {/* Vínculos a documentos comerciales */}
        {(recepcion || pedido) && (
          <div className="mt-4 flex flex-wrap gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            {pedido && (
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <FileText size={14} className="text-amber-600" />
                <span>Pedido Origen:</span>
                <Link className="font-mono font-bold text-amber-700 hover:underline" href={`/compras/pedidos/${pedido.id}`}>
                  {pedido.numero}
                </Link>
              </div>
            )}
            {recepcion && (
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Truck size={14} className="text-emerald-600" />
                <span>Recepción de Mercancía:</span>
                <Link className="font-mono font-bold text-emerald-700 hover:underline" href={`/compras/recepciones/${recepcion.id}`}>
                  {recepcion.numero}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tabla de Artículos */}
        <div className="overflow-x-auto mt-6">
          <table className="tabla w-full min-w-[550px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-white py-3 px-3">No.</th>
                <th className="text-white py-3 px-3">Artículo Recibido</th>
                <th className="text-white py-3 px-3 text-center">Cantidad</th>
                <th className="text-white py-3 px-3 text-right">Costo Unitario ({simbolo})</th>
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
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {numero(item.cantidad)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {dinero(item.precio, simbolo)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {dinero(item.importe, simbolo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen Financiero */}
        <div className="ml-auto mt-5 max-w-xs space-y-1.5 text-xs">
          {descuento > 0 && (
            <p className="flex justify-between text-slate-600">
              <span>Descuento Comercial:</span>
              <span className="font-mono text-rose-600">-{dinero(descuento, simbolo)}</span>
            </p>
          )}
          {(compra.iva ?? isv) > 0 && (
            <p className="flex justify-between text-slate-600">
              <span>{config.impuesto?.nombre || "I.V.A."} ({config.impuesto?.porcentaje || 15}%):</span>
              <span className="font-mono text-slate-800">{dinero(compra.iva ?? isv, simbolo)}</span>
            </p>
          )}
          <p className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-extrabold text-slate-900">
            <span>Total Inversión</span>
            <span className="font-mono text-lg text-emerald-700">{dinero(total, simbolo)}</span>
          </p>

          {compra.condicionPago === "CREDITO" && (
            <div className="mt-3 rounded-lg bg-amber-50 p-2.5 border border-amber-200">
              <div className="flex justify-between text-xs font-bold text-amber-900">
                <span>Saldo Pendiente:</span>
                <span className="font-mono text-sm text-rose-700">
                  {dinero(compra.saldoPendiente ?? total, simbolo)}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-amber-800">
                <span>Estado de Pago:</span>
                <span className="font-bold uppercase">{compra.estadoPago ?? "PENDIENTE"}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <p>
            {compra.anulada
              ? "⚠ Compra anulada: Las existencias ingresadas han sido descontadas del kárdex."
              : "✓ Mercadería ingresada y contabilizada en el inventario general de la ferretería."}
          </p>
          <p className="font-semibold text-slate-600">Registrado por: {compra.creadoPor}</p>
        </div>

        {/* Firmas de Recepción Oficial para Impresión */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-4 px-6 text-center text-xs text-slate-700">
          <div>
            <div className="border-t border-slate-800 w-48 mx-auto pt-1 font-bold">Bodeguero Receptor</div>
            <div className="text-[10px] text-slate-500">{compra.creadoPor}</div>
          </div>
          <div>
            <div className="border-t border-slate-800 w-48 mx-auto pt-1 font-bold">Entregado por Proveedor</div>
            <div className="text-[10px] text-slate-500">{compra.proveedor}</div>
          </div>
        </div>
      </Membrete>

      {/* Historial de Pagos / Abonos si es Crédito */}
      {compra.condicionPago === "CREDITO" && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Historial de Pagos y Abonos a Cuenta</h3>
            </div>
          </div>

          {pagos && pagos.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="tabla w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="py-2 px-3">Recibo / Folio</th>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3">Forma de Pago</th>
                    <th className="py-2 px-3">Referencia</th>
                    <th className="py-2 px-3 text-right">Monto ({simbolo})</th>
                    <th className="py-2 px-3">Registrado por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagos.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.numero}</td>
                      <td className="py-2 px-3">{fechaCorta(p.fecha)}</td>
                      <td className="py-2 px-3 font-medium">{p.formaPago}</td>
                      <td className="py-2 px-3 text-slate-500">{p.referencia || "—"}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        {dinero(p.monto, simbolo)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{p.creadoPor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">No se han registrado abonos a esta factura todavía.</p>
          )}

          {!compra.anulada && (compra.saldoPendiente ?? 0) > 0.001 && (
            <form action={crearAbonoCompraAction} className="mt-4 border-t border-slate-100 pt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="compraId" value={compra.id} />
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Fecha del Abono
                </label>
                <input
                  type="date"
                  name="fecha"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                  className="h-9 rounded-lg border border-slate-300 px-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Monto a Abonar ({simbolo})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={compra.saldoPendiente}
                  defaultValue={compra.saldoPendiente}
                  name="monto"
                  required
                  className="h-9 w-32 rounded-lg border border-slate-300 px-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Forma de Pago
                </label>
                <select name="formaPago" className="h-9 rounded-lg border border-slate-300 px-2 text-xs">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Referencia / Comprobante
                </label>
                <input
                  type="text"
                  name="referencia"
                  placeholder="Ej. Cheque #5541..."
                  className="h-9 rounded-lg border border-slate-300 px-2 text-xs"
                />
              </div>
              <button type="submit" className="btn btn-amarillo h-9 px-4 text-xs font-bold shadow-xs">
                Registrar Abono
              </button>
            </form>
          )}
        </div>
      )}

      {/* Historial de Devoluciones Asociadas */}
      {devoluciones && devoluciones.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Undo2 size={18} className="text-rose-600" />
            <h3 className="font-bold text-slate-900 text-sm">Devoluciones de Mercancía a este Proveedor</h3>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="tabla w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="py-2 px-3">Folio Devolución</th>
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Motivo</th>
                  <th className="py-2 px-3">Nota de Crédito</th>
                  <th className="py-2 px-3 text-right">Total Devuelto ({simbolo})</th>
                  <th className="py-2 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devoluciones.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{d.numero}</td>
                    <td className="py-2 px-3">{fechaCorta(d.fecha)}</td>
                    <td className="py-2 px-3 text-slate-700">{d.motivo}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{d.notaCreditoProveedor || "—"}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                      {dinero(d.total, simbolo)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                        href={`/compras/devoluciones/${d.id}`}
                      >
                        Ver Detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botón de Anulación de Compra */}
      {!compra.anulada && (
        <div className="no-print mt-6 flex justify-end bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <FormularioConfirmar
            action={anularCompraAction}
            mensaje="¿Desea anular esta compra de mercadería? Las unidades ingresadas se restarán automáticamente del inventario si no existen ventas o movimientos posteriores."
          >
            <input type="hidden" name="id" value={compra.id} />
            <button className="btn btn-rojo h-10 px-4 text-xs font-bold gap-1.5">
              <XCircle size={15} />
              Anular Compra y Revertir Stock
            </button>
          </FormularioConfirmar>
        </div>
      )}
    </PageDocument>
  );
}
