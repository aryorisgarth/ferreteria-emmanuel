import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  ClipboardList,
  FileCheck2,
  Package,
  Plus,
  Truck,
  Warehouse,
} from "lucide-react";
import { Aviso, PageDocument, Sello } from "@/components/documentos/Pieza";
import { fechaCorta } from "@/lib/format";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Panel de Bodega" };

export default async function BodegaPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const [resumen, solicitudes, actas] = await Promise.all([
    api.resumen(),
    api.solicitudes(1, "APROBADO"),
    api.actas(1),
  ]);

  const kpis = [
    { label: "Pendientes Entrega", valor: `${solicitudes.total}`, sub: "Requisiciones aprobadas", icon: ClipboardList, color: "text-amber-600 bg-amber-500/10", href: "/solicitudes" },
    { label: "Actas Registradas", valor: `${actas.total}`, sub: "Constancias de salida", icon: FileCheck2, color: "text-blue-600 bg-blue-500/10", href: "/actas" },
    { label: "Artículos en Stock", valor: `${resumen.productos}`, sub: "Catálogo activo", icon: Package, color: "text-emerald-600 bg-emerald-500/10", href: "/inventario" },
    { label: "En Nivel Crítico", valor: `${resumen.stockBajo.length}`, sub: "Bajo umbral mínimo", icon: AlertTriangle, color: "text-rose-600 bg-rose-500/10", href: "/inventario" },
  ];

  const accesos = [
    { href: "/movimientos", titulo: "Movimientos de Almacén", desc: "Entradas rápidas, salidas directas y carga masiva CSV de patio.", icon: ArrowLeftRight, boton: "Ir a Movimientos" },
    { href: "/solicitudes", titulo: "Solicitudes Internas", desc: "Requisiciones de materiales creadas por cuadrillas o dependencias.", icon: ClipboardList, boton: "Ver Solicitudes" },
    { href: "/actas", titulo: "Actas de Entrega", desc: "Comprobantes foliados con firmas de recibido y entregado conforme.", icon: FileCheck2, boton: "Ver Actas" },
  ];

  return (
    <PageDocument
      seccion="Almacén Central"
      titulo="Panel Ejecutivo de Bodega"
      acciones={
        <div className="flex items-center gap-2">
          <Link href="/solicitudes/nueva" className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs">
            <Plus size={16} /> Nueva Solicitud
          </Link>
          <Link href="/movimientos" className="btn h-10 px-4 text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 gap-1.5">
            <ArrowLeftRight size={16} /> Registrar Movimiento
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* 1. Indicadores Clave (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} href={kpi.href} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
                <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpi.valor}</p>
                <p className="text-[10px] text-slate-500">{kpi.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 2. Módulos Operativos de Bodega */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Centros de Trabajo de Patio</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accesos.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.href} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800 mb-3">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{a.titulo}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{a.desc}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <Link href={a.href} className="btn btn-linea w-full h-9 text-xs font-bold justify-center">
                    {a.boton} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Requerimientos Aprobados Pendientes de Salida Física */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Despachos Pendientes de Entrega en Patio</h2>
            <p className="text-xs text-slate-500">Solicitudes autorizadas esperando retiro físico de mercadería.</p>
          </div>
          <Link href="/movimientos" className="text-xs font-bold text-amber-600 hover:underline">
            Ir a entregar en Movimientos →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Número</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4">Destinatario</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {solicitudes.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No hay solicitudes pendientes de retiro. Todo el patio está al día.
                    </td>
                  </tr>
                ) : (
                  solicitudes.rows.slice(0, 5).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 sm:px-6 font-bold text-amber-700">
                        <Link href={`/solicitudes/${s.id}`} className="hover:underline">{s.numero}</Link>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">{fechaCorta(s.fecha)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.solicitante}</td>
                      <td className="py-3 px-4 text-slate-600">{s.destinatario}</td>
                      <td className="py-3 px-4"><Sello estado={s.estado} /></td>
                      <td className="py-3 px-4 sm:px-6 text-right">
                        <Link href="/movimientos" className="btn btn-amarillo h-8 px-3 text-xs font-bold shadow-xs">
                          Despachar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageDocument>
  );
}
