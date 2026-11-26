import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  PackageCheck,
  XCircle,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { cambiarEstadoPedidoAction } from "@/app/actions";
import { FormularioConfirmar } from "@/components/forms/FormularioConfirmar";
import { BotonImprimir } from "@/components/documentos/Imprimir";
import { Membrete } from "@/components/documentos/Membrete";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { dinero, etiquetaUnidad, fechaCorta, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Detalle de Pedido de Compra" };

export default async function PedidoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [detalle, config] = await Promise.all([
    api.pedido(id),
    obtenerConfiguracion(),
  ]);

  if (!detalle) notFound();

  const { pedido, items, total, recepciones } = detalle;
  const simbolo = config.moneda.simbolo;

  const hayPendientes = items.some((it) => it.cantidadPendiente > 0.0001);

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo={`Pedido ${pedido.numero}`}
      acciones={
        <div className="flex items-center gap-2">
          {pedido.estado !== "CANCELADO" && pedido.estado !== "RECIBIDO" && (
            <Link
              className="btn btn-amarillo h-10 px-3 text-xs font-bold gap-1.5 no-print"
              href={`/compras/recepciones/nueva?pedidoId=${pedido.id}`}
            >
              <PackageCheck size={15} />
              Recibir Mercancía
            </Link>
          )}
          <BotonImprimir>
            <Printer size={15} />
            Imprimir Pedido
          </BotonImprimir>
          <Link className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5 no-print" href="/compras/pedidos">
            <ArrowLeft size={15} />
            Volver
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      <Membrete titulo="ORDEN / PEDIDO DE COMPRA" correlativo={pedido.numero} variante="invoice" empresa={config.empresa}>
        <div className="flex flex-wrap justify-between gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proveedor Solicitado</p>
            <p className="mt-1 text-base sm:text-lg font-bold text-slate-900">{pedido.proveedor}</p>
            {pedido.notas && (
              <p className="mt-1 text-xs text-slate-500 max-w-md bg-slate-50 p-2 rounded-lg border border-slate-100">
                {pedido.notas}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Datos de la Orden</p>
            <p className="mt-1 font-semibold text-slate-800">Emisión: {fechaCorta(pedido.fechaEmision)}</p>
            {pedido.fechaEntregaEstimada && (
              <p className="text-xs text-slate-500">Entrega Estimada: {fechaCorta(pedido.fechaEntregaEstimada)}</p>
            )}
            <div className="mt-2">
              <span
                className={`inline-block rounded-full px-3 py-1 font-bold text-xs uppercase tracking-wider ${
                  pedido.estado === "RECIBIDO"
                    ? "bg-emerald-100 text-emerald-900"
                    : pedido.estado === "PARCIAL"
                    ? "bg-blue-100 text-blue-900"
                    : pedido.estado === "EMITIDO"
                    ? "bg-amber-100 text-amber-900"
                    : pedido.estado === "CANCELADO"
                    ? "bg-rose-100 text-rose-900"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                Estado: {pedido.estado}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Artículos Pedidos */}
        <div className="overflow-x-auto mt-6">
          <table className="tabla w-full min-w-[600px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-white py-3 px-3">No.</th>
                <th className="text-white py-3 px-3">Artículo Solicitado</th>
                <th className="text-white py-3 px-3 text-center">Cant. Pedida</th>
                <th className="text-white py-3 px-3 text-center">Cant. Recibida</th>
                <th className="text-white py-3 px-3 text-center">Cant. Pendiente</th>
                <th className="text-white py-3 px-3 text-right">Precio Ref. ({simbolo})</th>
                <th className="text-white py-3 px-3 text-right">Subtotal Ref. ({simbolo})</th>
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
                    {numero(item.cantidadPedida)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-emerald-700">
                    {numero(item.cantidadRecibida)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                    {numero(item.cantidadPendiente)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {dinero(item.precioUnitario, simbolo)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {dinero(item.subtotal, simbolo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Estimado */}
        <div className="ml-auto mt-5 max-w-xs space-y-1.5 text-xs">
          <p className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-extrabold text-slate-900">
            <span>Presupuesto Estimado</span>
            <span className="font-mono text-lg text-amber-800">{dinero(total, simbolo)}</span>
          </p>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <p>
            {pedido.estado === "CANCELADO"
              ? "⚠ Pedido cancelado."
              : "✓ Este documento es una orden de abastecimiento. No incrementa stock hasta el acta de recepción."}
          </p>
          <p className="font-semibold text-slate-600">Emitido por: {pedido.creadoPor}</p>
        </div>
      </Membrete>

      {/* Recepciones Vinculadas */}
      {recepciones && recepciones.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Truck size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Recepciones Físicas Vinculadas a este Pedido</h3>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="tabla w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="py-2 px-3">Folio Recepción</th>
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Remisión Proveedor</th>
                  <th className="py-2 px-3">Responsable</th>
                  <th className="py-2 px-3 text-center">Conformidad</th>
                  <th className="py-2 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recepciones.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{r.numero}</td>
                    <td className="py-2 px-3">{fechaCorta(r.fecha)}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{r.remisionProveedor || "—"}</td>
                    <td className="py-2 px-3 text-slate-700">{r.responsable}</td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700">{r.estadoConformidad}</td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                        href={`/compras/recepciones/${r.id}`}
                      >
                        Ver Recepción
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Acciones de Estado (Cancelar Pedido si no se recibió) */}
      {pedido.estado === "EMITIDO" && (!recepciones || recepciones.length === 0) && (
        <div className="no-print mt-6 flex justify-end bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <FormularioConfirmar
            action={cambiarEstadoPedidoAction}
            mensaje="¿Desea cancelar este pedido de compra? Se liberará el compromiso con el proveedor sin afectar existencias."
          >
            <input type="hidden" name="id" value={pedido.id} />
            <input type="hidden" name="estado" value="CANCELADO" />
            <button className="btn btn-rojo h-10 px-4 text-xs font-bold gap-1.5">
              <XCircle size={15} />
              Cancelar Pedido de Compra
            </button>
          </FormularioConfirmar>
        </div>
      )}
    </PageDocument>
  );
}
