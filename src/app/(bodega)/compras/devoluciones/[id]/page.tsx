import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  ShoppingCart,
  Undo2,
  FileText,
} from "lucide-react";
import { BotonImprimir } from "@/components/documentos/Imprimir";
import { Membrete } from "@/components/documentos/Membrete";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { dinero, etiquetaUnidad, fechaCorta, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Detalle de Devolución a Proveedor" };

export default async function DevolucionDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [detalle, config] = await Promise.all([
    api.devolucion(id),
    obtenerConfiguracion(),
  ]);

  if (!detalle) notFound();

  const { devolucion, items, total, compra } = detalle;
  const simbolo = config.moneda.simbolo;

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo={`Devolución ${devolucion.numero}`}
      volverUrl="/compras/devoluciones"
      acciones={
        <div className="flex items-center gap-2">
          <BotonImprimir>
            <Printer size={15} />
            Imprimir Comprobante
          </BotonImprimir>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      <Membrete titulo="COMPROBANTE DE DEVOLUCIÓN A PROVEEDOR" correlativo={devolucion.numero} variante="invoice" empresa={config.empresa}>
        <div className="flex flex-wrap justify-between gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proveedor / Distribuidor</p>
            <p className="mt-1 text-base sm:text-lg font-bold text-slate-900">{devolucion.proveedor}</p>
            <p className="mt-1 text-xs text-slate-600">
              <strong className="text-slate-800">Motivo:</strong> {devolucion.motivo}
            </p>
            {devolucion.notaCreditoProveedor && (
              <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                Nota de Crédito Proveedor: <span className="text-rose-700">{devolucion.notaCreditoProveedor}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Salida de Bodega</p>
            <p className="mt-1 font-semibold text-slate-800">Fecha: {fechaCorta(devolucion.fecha)}</p>
            <div className="mt-2">
              <span className="inline-block rounded-full px-3 py-1 font-bold text-xs uppercase tracking-wider bg-rose-100 text-rose-900">
                Salida Aplicada en Kárdex
              </span>
            </div>
          </div>
        </div>

        {compra && (
          <div className="mt-4 flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <ShoppingCart size={15} className="text-amber-600" />
            <span className="text-slate-600 font-medium">Factura de Compra de Origen:</span>
            <Link className="font-mono font-bold text-amber-700 hover:underline" href={`/compras/${compra.id}`}>
              {compra.numero} {compra.facturaProveedor ? `(Fact: ${compra.facturaProveedor})` : ""}
            </Link>
          </div>
        )}

        {/* Tabla de Artículos Devueltos */}
        <div className="overflow-x-auto mt-6">
          <table className="tabla w-full min-w-[550px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-white py-3 px-3">No.</th>
                <th className="text-white py-3 px-3">Artículo Devuelto</th>
                <th className="text-white py-3 px-3 text-center">Cantidad Saliente</th>
                <th className="text-white py-3 px-3 text-right">Costo Unitario ({simbolo})</th>
                <th className="text-white py-3 px-3 text-right">Importe Devuelto ({simbolo})</th>
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
                    {item.observacion && (
                      <p className="text-[10px] text-slate-400 italic">{item.observacion}</p>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-800">
                    -{numero(item.cantidad)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {dinero(item.costoUnitario, simbolo)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {dinero(item.subtotal, simbolo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Valor Devuelto */}
        <div className="ml-auto mt-5 max-w-xs space-y-1.5 text-xs">
          <p className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-extrabold text-slate-900">
            <span>Total Mercancía Devuelta</span>
            <span className="font-mono text-lg text-rose-700">{dinero(total, simbolo)}</span>
          </p>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <p>✓ Salida física descontada del inventario y registrada en el kárdex.</p>
          <p className="font-semibold text-slate-600">Registrado por: {devolucion.creadoPor}</p>
        </div>
      </Membrete>
    </PageDocument>
  );
}
