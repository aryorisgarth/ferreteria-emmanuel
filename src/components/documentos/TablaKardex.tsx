import Link from "next/link";
import {
  etiquetaAuditoria,
  etiquetaTipo,
  etiquetaUnidad,
  fechaCorta,
  numero,
} from "@/lib/format";
import type { MovimientoVista, OrigenMovimiento } from "@/lib/types";

function formatearHora(val: any): string | null {
  if (!val) return null;
  if (typeof val === "string") return val.length >= 16 ? val.slice(11, 16) : val;
  if (val instanceof Date) return val.toISOString().slice(11, 16);
  return String(val).slice(11, 16);
}

function badgeOrigen(origen: OrigenMovimiento) {
  const estilos: Record<OrigenMovimiento, string> = {
    FACTURA: "bg-emerald-50 text-emerald-700 border-emerald-200",
    COMPRA: "bg-blue-50 text-blue-700 border-blue-200",
    AJUSTE: "bg-purple-50 text-purple-700 border-purple-200",
    SOLICITUD: "bg-amber-50 text-amber-700 border-amber-200",
    SALIDA_DIRECTA: "bg-orange-50 text-orange-700 border-orange-200",
    MANUAL: "bg-slate-50 text-slate-700 border-slate-200",
    EXCEL: "bg-teal-50 text-teal-700 border-teal-200",
  };
  const nombres: Record<OrigenMovimiento, string> = {
    FACTURA: "Factura",
    COMPRA: "Compra",
    AJUSTE: "Ajuste",
    SOLICITUD: "Solicitud",
    SALIDA_DIRECTA: "Salida",
    MANUAL: "Manual",
    EXCEL: "Excel",
  };
  return (
    <span
      className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        estilos[origen] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {nombres[origen] || origen}
    </span>
  );
}

export function TablaKardex({
  filas,
}: {
  filas: MovimientoVista[];
  conEdicion?: boolean;
}) {
  return (
    <div className="bg-white rounded-[6px] border border-slate-200 shadow-2xs overflow-hidden">
      {/* Vista de Tarjetas para Dispositivos Móviles (lg:hidden) */}
      <div className="lg:hidden divide-y divide-slate-100">
        {filas.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No se encontraron movimientos registrados con los filtros aplicados.
          </div>
        ) : (
          filas.map((fila) => {
            const esEntrada = fila.tipo === "ENTRADA" || (fila.entradas && fila.entradas > 0);
            const esSalida = fila.tipo === "SALIDA" || (fila.salidas && fila.salidas > 0);
            const hora = formatearHora(fila.createdAt);
            const destino = [fila.destinatario, fila.oficinaNombre]
              .filter((valor, indice, lista) => valor && lista.indexOf(valor) === indice)
              .join(" · ");

            return (
              <div
                key={fila.id}
                className={`p-4 space-y-2.5 transition ${
                  fila.esAuditoria ? "bg-rose-50/50 border-l-4 border-l-rose-500" : "hover:bg-slate-50/60"
                }`}
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {fechaCorta(fila.fecha)}
                        {hora ? ` ${hora}` : ""}
                      </span>
                      {badgeOrigen(fila.origen)}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          esEntrada
                            ? "bg-emerald-100 text-emerald-800"
                            : esSalida
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {etiquetaTipo(fila.tipo)}
                      </span>
                      {fila.numeroReferencia && (
                        <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {fila.numeroReferencia}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-bold text-sm text-slate-900 leading-snug">
                      <span className="font-mono text-xs text-amber-700 mr-1.5">{fila.codigo}</span>
                      {fila.nombre}
                    </p>
                  </div>

                  {/* Saldo Resultante */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo</span>
                    <span className="font-mono font-extrabold text-sm text-slate-900">
                      {numero(fila.stockSaldo)} <span className="text-xs font-normal text-slate-500">{etiquetaUnidad(fila.unidadMedida)}</span>
                    </span>
                  </div>
                </div>

                {/* Resumen Físico */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 font-mono">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Entrada</span>
                    <span className={`font-bold ${fila.entradas ? "text-emerald-700" : "text-slate-400"}`}>
                      {fila.entradas ? `+${numero(fila.entradas)}` : "—"}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Salida</span>
                    <span className={`font-bold ${fila.salidas ? "text-rose-600" : "text-slate-400"}`}>
                      {fila.salidas ? `-${numero(fila.salidas)}` : "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Destino</span>
                    <span className="text-slate-700 truncate block font-sans" title={destino || ""}>
                      {destino || "—"}
                    </span>
                  </div>
                </div>

                {/* Pie informativo */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="truncate max-w-[220px]" title={fila.concepto}>
                    {fila.concepto}
                  </span>
                  <span>
                    Resp: <strong className="text-slate-700">{fila.usuario}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vista de Tabla Completa para Escritorio e Impresión (hidden lg:block) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="tabla tabla-kardex w-full min-w-[1100px] text-left text-xs">
          <thead className="kardex-head bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3">Fecha y Hora</th>
              <th className="py-3 px-3">Folio / Ref</th>
              <th className="py-3 px-3">Código e Ítem</th>
              <th className="py-3 px-3 text-center">U.M.</th>
              <th className="py-3 px-3 text-center">Origen</th>
              <th className="py-3 px-3 text-center">Tipo</th>
              <th className="py-3 px-3 text-right">Entrada</th>
              <th className="py-3 px-3 text-right">Salida</th>
              <th className="py-3 px-3 text-right">Saldo Físico</th>
              <th className="py-3 px-3">Destinatario / Entidad</th>
              <th className="py-3 px-3">Concepto</th>
              <th className="py-3 px-3">Responsable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  No hay movimientos registrados que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filas.map((fila) => {
                const esEntrada = fila.tipo === "ENTRADA" || (fila.entradas && fila.entradas > 0);
                const esSalida = fila.tipo === "SALIDA" || (fila.salidas && fila.salidas > 0);
                const hora = formatearHora(fila.createdAt);
                const destino = [fila.destinatario, fila.oficinaNombre]
                  .filter((valor, indice, lista) => valor && lista.indexOf(valor) === indice)
                  .join(" · ");

                return (
                  <tr
                    key={fila.id}
                    className={`transition ${
                      fila.esAuditoria
                        ? "bg-rose-50/60 font-medium text-rose-950"
                        : "hover:bg-slate-50/70 text-slate-800"
                    }`}
                  >
                    {/* Fecha y Hora */}
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                      <span className="font-bold text-slate-900">{fechaCorta(fila.fecha)}</span>
                      {hora && <span className="block text-[11px] text-slate-400">{hora}</span>}
                    </td>

                    {/* Folio / Referencia */}
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {fila.numeroReferencia || "—"}
                    </td>

                    {/* Código y Producto */}
                    <td className="py-2.5 px-3 max-w-[240px]">
                      <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {fila.codigo}
                      </span>
                      <p className="font-semibold text-slate-900 truncate mt-0.5" title={fila.nombre}>
                        {fila.nombre}
                      </p>
                    </td>

                    {/* Unidad de Medida */}
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {etiquetaUnidad(fila.unidadMedida)}
                    </td>

                    {/* Origen Documental */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {badgeOrigen(fila.origen)}
                    </td>

                    {/* Tipo Movimiento */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          esEntrada
                            ? "bg-emerald-100 text-emerald-800"
                            : esSalida
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {etiquetaTipo(fila.tipo)}
                      </span>
                    </td>

                    {/* Entrada */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {fila.entradas ? `+${numero(fila.entradas)}` : "—"}
                    </td>

                    {/* Salida */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                      {fila.salidas ? `-${numero(fila.salidas)}` : "—"}
                    </td>

                    {/* Saldo Físico */}
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                      {numero(fila.stockSaldo)}
                    </td>

                    {/* Destinatario / Entidad */}
                    <td className="py-2.5 px-3 max-w-[150px] truncate text-slate-600" title={destino || ""}>
                      {destino || "—"}
                    </td>

                    {/* Concepto */}
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-700" title={fila.concepto}>
                      {fila.concepto}
                    </td>

                    {/* Responsable */}
                    <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                      {fila.usuario}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
