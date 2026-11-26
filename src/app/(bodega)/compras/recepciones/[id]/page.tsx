import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  FileText,
  ShoppingCart,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { BotonImprimir } from "@/components/documentos/Imprimir";
import { Membrete } from "@/components/documentos/Membrete";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { dinero, etiquetaUnidad, fechaCorta, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Detalle de Recepción de Mercancía" };

export default async function RecepcionDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [detalle, config] = await Promise.all([
    api.recepcion(id),
    obtenerConfiguracion(),
  ]);

  if (!detalle) notFound();

  const { recepcion, items, total, pedido, compra } = detalle;
  const simbolo = config.moneda.simbolo;

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo={`Recepción ${recepcion.numero}`}
      acciones={
        <div className="flex items-center gap-2">
          {!compra && (
            <Link
              className="btn btn-amarillo h-10 px-3 text-xs font-bold gap-1.5 no-print"
              href={`/compras/nueva?recepcionId=${recepcion.id}`}
            >
              <ShoppingCart size={15} />
              Registrar Factura de Proveedor
            </Link>
          )}
          <BotonImprimir>
            <Printer size={15} />
            Imprimir Acta
          </BotonImprimir>
          <Link className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5 no-print" href="/compras/recepciones">
            <ArrowLeft size={15} />
            Volver
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      <Membrete titulo="ACTA DE RECEPCIÓN FÍSICA" correlativo={recepcion.numero} variante="invoice" empresa={config.empresa}>
        <div className="flex flex-wrap justify-between gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proveedor / Distribuidor</p>
            <p className="mt-1 text-base sm:text-lg font-bold text-slate-900">{recepcion.proveedor}</p>
            {recepcion.remisionProveedor && (
              <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                Remisión del Proveedor: <span className="text-emerald-700">{recepcion.remisionProveedor}</span>
              </p>
            )}
            {recepcion.notas && (
              <p className="mt-1 text-xs text-slate-500 max-w-md bg-slate-50 p-2 rounded-lg border border-slate-100">
                {recepcion.notas}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Control de Almacén</p>
            <p className="mt-1 font-semibold text-slate-800">Fecha de Entrada: {fechaCorta(recepcion.fecha)}</p>
            <p className="text-xs text-slate-500">Recibido por: {recepcion.responsable || "Bodega Central"}</p>
            <div className="mt-2">
              <span className="inline-block rounded-full px-3 py-1 font-bold text-xs uppercase tracking-wider bg-emerald-100 text-emerald-900">
                Conformidad: {recepcion.estadoConformidad || "CONFORME"}
              </span>
            </div>
          </div>
        </div>

        {/* Vínculos a documentos comerciales */}
        {(pedido || compra) && (
          <div className="mt-4 flex flex-wrap gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            {pedido && (
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <FileText size={14} className="text-amber-600" />
                <span>Pedido de Origen:</span>
                <Link className="font-mono font-bold text-amber-700 hover:underline" href={`/compras/pedidos/${pedido.id}`}>
                  {pedido.numero}
                </Link>
              </div>
            )}
            {compra && (
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <ShoppingCart size={14} className="text-emerald-600" />
                <span>Factura de Compra:</span>
                <Link className="font-mono font-bold text-emerald-700 hover:underline" href={`/compras/${compra.id}`}>
                  {compra.numero}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tabla de Artículos Recibidos */}
        <div className="overflow-x-auto mt-6">
          <table className="tabla w-full min-w-[550px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-white py-3 px-3">No.</th>
                <th className="text-white py-3 px-3">Artículo Recibido</th>
                <th className="text-white py-3 px-3 text-center">Cantidad Ingresada</th>
                <th className="text-white py-3 px-3 text-right">Costo Unit. ({simbolo})</th>
                <th className="text-white py-3 px-3 text-right">Valor Total ({simbolo})</th>
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
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-800">
                    +{numero(item.cantidadRecibida)}
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

        {/* Total Valorizado */}
        <div className="ml-auto mt-5 max-w-xs space-y-1.5 text-xs">
          <p className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-extrabold text-slate-900">
            <span>Valor de Mercancía Recibida</span>
            <span className="font-mono text-lg text-emerald-700">{dinero(total, simbolo)}</span>
          </p>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <p>✓ Movimiento de entrada asentado en Kárdex. El Costo Promedio Ponderado fue actualizado.</p>
          <p className="font-semibold text-slate-600">Registrado por: {recepcion.responsable || "Bodeguero"}</p>
        </div>
      </Membrete>
    </PageDocument>
  );
}
