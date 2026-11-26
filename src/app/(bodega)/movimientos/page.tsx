import Link from "next/link";
import { entregarAction } from "@/app/actions";
import { Aviso, PageDocument, Paginacion, Sello } from "@/components/documentos/Pieza";
import { FormularioEntrada, FormularioExcel, FormularioSalidaDirecta } from "@/components/forms/Formularios";
import { fechaCorta } from "@/lib/format";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Movimientos" };

export default async function Movimientos({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; error?: string; aprobadas?: string; entregadas?: string }>;
}) {
  const sp = await searchParams;
  const [catalogo, oficinas, fecha, aprobadas, entregadas] = await Promise.all([
    api.catalogo(),
    api.oficinas(),
    api.fecha(),
    api.solicitudes(Number(sp.aprobadas || 1), "APROBADO"),
    api.solicitudes(Number(sp.entregadas || 1), "ENTREGADO"),
  ]);

  return (
    <PageDocument seccion="Bodega Central" titulo="Entradas y Salidas de Almacén" folio="MOV">
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      <div className="space-y-6">
        <FormularioEntrada catalogo={catalogo} fecha={fecha} />
        <FormularioSalidaDirecta catalogo={catalogo} oficinas={oficinas} fecha={fecha} />
        <FormularioExcel fecha={fecha} />
      </div>

      <div className="mt-12 space-y-3">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Solicitudes Aprobadas (Pendientes de Descargo)
        </h2>
        <p className="text-xs text-slate-500">
          El inventario sale de bodega al confirmar la entrega. No puede descontarse dos veces.
        </p>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Solicitud</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Destinatario</th>
                  <th className="py-3 px-4">Acta Vinculada</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aprobadas.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No hay solicitudes aprobadas pendientes de entrega.
                    </td>
                  </tr>
                ) : (
                  aprobadas.rows.map((fila) => (
                    <tr key={fila.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 sm:px-6 font-bold text-amber-700">
                        <Link className="hover:underline" href={`/solicitudes/${fila.id}`}>
                          {fila.numero}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">{fechaCorta(fila.fecha)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{fila.destinatario}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{fila.actaNumero}</td>
                      <td className="py-3 px-4 sm:px-6 text-right">
                        <form action={entregarAction}>
                          <input type="hidden" name="id" value={fila.id} />
                          <input type="hidden" name="volver" value="/movimientos" />
                          <button className="btn btn-amarillo h-8 px-3.5 text-xs font-bold shadow-xs">
                            Entregar
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Paginacion
          page={aprobadas.page}
          pages={aprobadas.pages}
          total={aprobadas.total}
          ruta="/movimientos"
          params={{ entregadas: sp.entregadas }}
          clave="aprobadas"
        />
      </div>

      <div className="mt-12 space-y-3">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Historial de Entregadas</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Solicitud</th>
                  <th className="py-3 px-4">Destinatario</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Revisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entregadas.rows.map((fila) => (
                  <tr key={fila.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 sm:px-6 font-bold text-slate-800">{fila.numero}</td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{fila.destinatario}</td>
                    <td className="py-3 px-4">
                      <Sello estado={fila.estado} />
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right">
                      <form action={entregarAction}>
                        <input type="hidden" name="id" value={fila.id} />
                        <input type="hidden" name="volver" value="/movimientos" />
                        <button className="h-8 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
                          Recargar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Paginacion
          page={entregadas.page}
          pages={entregadas.pages}
          total={entregadas.total}
          ruta="/movimientos"
          params={{ aprobadas: sp.aprobadas }}
          clave="entregadas"
        />
      </div>
    </PageDocument>
  );
}
