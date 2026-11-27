import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  Truck,
  Warehouse,
} from "lucide-react";
import { borrarProveedorAction, desactivarProveedorAction } from "@/app/actions";
import { FormularioConfirmar } from "@/components/forms/FormularioConfirmar";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { FormularioPersona } from "@/components/forms/Persona";
import { dinero, fechaCorta } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Perfil del Proveedor" };

export default async function ProveedorDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [perfil, config] = await Promise.all([
    api.perfilProveedor(id),
    obtenerConfiguracion(),
  ]);

  if (!perfil) notFound();

  const { proveedor, compras, totalComprado } = perfil;
  const simbolo = config.moneda.simbolo;

  return (
    <PageDocument
      seccion="Proveedores"
      titulo={`Perfil: ${proveedor.nombre}`}
      volverUrl="/proveedores"
      acciones={
        <div className="flex items-center gap-2">
          <Link className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs" href="/compras/nueva">
            <Plus size={15} />
            Nueva Compra de Mercadería
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* 1. Tarjeta Resumen del Proveedor */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700 text-xl font-black">
              {proveedor.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{proveedor.nombre}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${proveedor.activo !== false
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                    }`}
                >
                  {proveedor.activo !== false ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {(proveedor.identificacion || proveedor.notas) && (
                  <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    RUC: {proveedor.identificacion || proveedor.notas}
                  </span>
                )}
                {proveedor.contacto && (
                  <span className="text-slate-600 font-semibold">
                    Contacto: {proveedor.contacto}
                  </span>
                )}
                {proveedor.diasCredito !== undefined && (
                  <span className="font-mono text-slate-600">
                    Crédito: {proveedor.diasCredito} días
                  </span>
                )}
                {proveedor.telefono && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone size={13} className="text-slate-400" />
                    {proveedor.telefono}
                  </span>
                )}
                {proveedor.email && (
                  <span className="font-mono text-slate-600">
                    {proveedor.email}
                  </span>
                )}
                {proveedor.direccion && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    {proveedor.direccion}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form action={desactivarProveedorAction}>
              <input type="hidden" name="id" value={proveedor.id} />
              <input type="hidden" name="activo" value={proveedor.activo !== false ? "false" : "true"} />
              <button
                type="submit"
                className={`btn btn-linea h-10 px-3 text-xs font-bold ${proveedor.activo !== false
                  ? "text-slate-600 hover:text-rose-700"
                  : "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  }`}
              >
                {proveedor.activo !== false ? "Desactivar" : "Reactivar"}
              </button>
            </form>

            {proveedor.telefono && (
              <a
                href={`https://wa.me/${proveedor.telefono.replace(/\D/g, "")}`}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Comprado</span>
            <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
              {dinero(totalComprado, simbolo)}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200/60 bg-rose-50/50 p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-800">Saldo Pendiente (CxP)</span>
            <p className="mt-1 font-mono text-base font-extrabold text-rose-700">
              {dinero(perfil.saldoTotalPendiente || 0, simbolo)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Compras Registradas</span>
            <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
              {compras.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Devoluciones</span>
            <p className="mt-1 font-mono text-base font-extrabold text-slate-900">
              {perfil.devoluciones?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Historial de Compras */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Truck size={17} className="text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">Compras y Reabastecimientos</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {compras.length} registro{compras.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="tabla w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 sm:px-6">Folio Compra</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Renglones</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Total Invertido ({simbolo})</th>
                <th className="py-3 px-4 sm:px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {compras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Aún no se han registrado compras con este proveedor.
                  </td>
                </tr>
              ) : (
                compras.map((item) => (
                  <tr key={item.compra.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 sm:px-6 font-mono font-bold text-slate-900">
                      <Link className="hover:text-amber-600" href={`/compras/${item.compra.id}`}>
                        {item.compra.numero}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4">{fechaCorta(item.compra.fecha)}</td>
                    <td className="py-2.5 px-4 font-mono">{item.compra.items.length} artículos</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.compra.anulada ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                      >
                        {item.compra.anulada ? "Anulada" : "Aplicada a Stock"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {dinero(item.total, simbolo)}
                    </td>
                    <td className="py-2.5 px-4 sm:px-6 text-right">
                      <Link
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                        href={`/compras/${item.compra.id}`}
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
          Editar Información del Proveedor
        </h3>
        <FormularioPersona tipo="proveedor" persona={proveedor} />

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <FormularioConfirmar
            action={borrarProveedorAction}
            mensaje={`¿Eliminar al proveedor "${proveedor.nombre}"?`}
          >
            <input type="hidden" name="id" value={proveedor.id} />
            <button className="btn btn-rojo h-10 px-4 text-xs font-bold gap-1.5">
              <Trash2 size={14} />
              Eliminar Proveedor
            </button>
          </FormularioConfirmar>
        </div>
      </div>
    </PageDocument>
  );
}
