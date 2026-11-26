import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Receipt,
  Trash2,
  User,
} from "lucide-react";
import { borrarClienteAction, desactivarClienteAction } from "@/app/actions";
import { FormularioConfirmar } from "@/components/forms/FormularioConfirmar";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { FormularioPersona } from "@/components/forms/Persona";
import { dinero, etiquetaFactura, etiquetaPago, fechaCorta } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Perfil del Cliente" };

export default async function ClienteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [perfil, config] = await Promise.all([
    api.perfilCliente(id),
    obtenerConfiguracion(),
  ]);

  if (!perfil) notFound();

  const { cliente, facturas, cotizaciones, totalComprado, saldoPendiente } = perfil;
  const simbolo = config.moneda.simbolo;

  return (
    <PageDocument
      seccion="Clientes"
      titulo={`Perfil: ${cliente.nombre}`}
      acciones={
        <div className="flex items-center gap-2">
          <Link className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href="/cotizaciones/nueva">
            <Plus size={15} />
            Nueva Cotización
          </Link>
          <Link className="btn btn-azul h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href="/facturas/nueva">
            <Receipt size={15} />
            Nueva Factura
          </Link>
          <Link className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5" href="/clientes">
            <ArrowLeft size={15} />
            Volver
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* 1. Tarjeta Resumen del Cliente */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 text-xl font-black">
              {cliente.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{cliente.nombre}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    cliente.activo !== false
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {cliente.activo !== false ? "Activo" : "Inactivo"}
                </span>
                <span className="rounded-full bg-blue-50 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
                  {cliente.tipo === "EMPRESA" ? "Empresa / Jurídico" : "Particular"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {(cliente.identificacion || cliente.notas) && (
                  <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    RUC/Cédula: {cliente.identificacion || cliente.notas}
                  </span>
                )}
                {cliente.telefono && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone size={13} className="text-slate-400" />
                    {cliente.telefono}
                  </span>
                )}
                {cliente.email && (
                  <span className="font-mono text-slate-600">
                    {cliente.email}
                  </span>
                )}
                {cliente.direccion && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    {cliente.direccion}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form action={desactivarClienteAction}>
              <input type="hidden" name="id" value={cliente.id} />
              <input type="hidden" name="activo" value={cliente.activo !== false ? "false" : "true"} />
              <button
                type="submit"
                className={`btn btn-linea h-10 px-3 text-xs font-bold ${
                  cliente.activo !== false
                    ? "text-slate-600 hover:text-rose-700"
                    : "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                {cliente.activo !== false ? "Desactivar" : "Reactivar"}
              </button>
            </form>

            {cliente.telefono && (
              <a
                href={`https://wa.me/${cliente.telefono.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-linea h-10 px-4 text-xs font-bold gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Métricas Comerciales */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-slate-100 pt-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Facturado</span>
            <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
              {dinero(totalComprado, simbolo)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-800">Saldo por Cobrar (Crédito)</span>
            <p className="mt-1 font-mono text-base font-extrabold text-amber-700">
              {dinero(saldoPendiente, simbolo)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Última Compra</span>
            <p className="mt-1 font-mono text-xs font-bold text-slate-800">
              {perfil.ultimaCompra ? fechaCorta(perfil.ultimaCompra) : "Sin compras"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Facturas</span>
            <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
              {facturas.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Cotizaciones</span>
            <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
              {cotizaciones.length}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Historial de Facturas */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Receipt size={17} className="text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">Historial de Facturas y Compras</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {facturas.length} comprobante{facturas.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="tabla w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 sm:px-6">Folio</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Condición</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Total ({simbolo})</th>
                <th className="py-3 px-4 sm:px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Este cliente aún no registra facturas emitidas.
                  </td>
                </tr>
              ) : (
                facturas.map((item) => (
                  <tr key={item.factura.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 sm:px-6 font-mono font-bold text-slate-900">
                      <Link className="hover:text-amber-600" href={`/facturas/${item.factura.id}`}>
                        {item.factura.numero}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4">{fechaCorta(item.factura.fecha)}</td>
                    <td className="py-2.5 px-4">{etiquetaPago(item.factura.formaPago)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.factura.estado === "PAGADA"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.factura.estado === "ANULADA"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {etiquetaFactura(item.factura.estado)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {dinero(item.total, simbolo)}
                    </td>
                    <td className="py-2.5 px-4 sm:px-6 text-right">
                      <Link
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                        href={`/facturas/${item.factura.id}`}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Formulario de Edición y Eliminación */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          Editar Información del Cliente
        </h3>
        <FormularioPersona tipo="cliente" persona={cliente} />

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <FormularioConfirmar
            action={borrarClienteAction}
            mensaje={`¿Eliminar al cliente "${cliente.nombre}"?`}
          >
            <input type="hidden" name="id" value={cliente.id} />
            <button className="btn btn-rojo h-10 px-4 text-xs font-bold gap-1.5">
              <Trash2 size={14} />
              Eliminar Cliente
            </button>
          </FormularioConfirmar>
        </div>
      </div>
    </PageDocument>
  );
}
