"use client";

import { numero } from "@/lib/format";

export function TablaArqueosAuditoriaReporte({
  reporteId,
  cajaTurnos,
  auditoria,
}: {
  reporteId: "arqueo_caja" | "auditoria_trazabilidad";
  cajaTurnos?: any;
  auditoria?: any;
}) {
  if (reporteId === "arqueo_caja" && cajaTurnos) {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-1">Apertura</th>
              <th className="border border-black py-1 px-1">Cierre</th>
              <th className="border border-black py-1 px-2 text-left">Cajero</th>
              <th className="border border-black py-1 px-1">Fondo Inicial</th>
              <th className="border border-black py-1 px-1">Ventas Efectivo</th>
              <th className="border border-black py-1 px-1">Egresos</th>
              <th className="border border-black py-1 px-1">Esperado</th>
              <th className="border border-black py-1 px-1">Real Contado</th>
              <th className="border border-black py-1 px-1">Diferencia</th>
              <th className="border border-black py-1 px-1">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {cajaTurnos.turnos.map((t: any) => (
              <tr key={t.id}>
                <td className="border border-black py-1 px-1 text-center font-mono">{t.fechaApertura}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{t.fechaCierre || "EN CURSO"}</td>
                <td className="border border-black py-1 px-2 text-left font-bold">{t.usuario}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(t.montoInicial)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(t.totalVentasEfectivo || 0)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono text-rose-700">{numero(t.totalEgresos || 0)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono font-bold">{numero(t.montoEsperado || 0)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{t.montoRealCierre !== undefined ? numero(t.montoRealCierre) : "—"}</td>
                <td className={`border border-black py-1 px-1 text-center font-mono font-bold ${t.diferencia > 0 ? "text-emerald-700" : t.diferencia < 0 ? "text-rose-700" : ""}`}>
                  {t.diferencia !== undefined ? `${t.diferencia > 0 ? "+" : ""}${numero(t.diferencia)}` : "—"}
                </td>
                <td className="border border-black py-1 px-1 text-center font-bold">{t.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (reporteId === "auditoria_trazabilidad" && auditoria) {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-1">Fecha</th>
              <th className="border border-black py-1 px-1">Operación</th>
              <th className="border border-black py-1 px-1">Referencia</th>
              <th className="border border-black py-1 px-1">Responsable</th>
              <th className="border border-black py-1 px-2 text-left">Descripción</th>
              <th className="border border-black py-1 px-2 text-center">Impacto</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {auditoria.map((a: any) => (
              <tr key={a.id}>
                <td className="border border-black py-1 px-1 text-center font-mono">{a.fecha}</td>
                <td className="border border-black py-1 px-1 text-center font-bold text-[9px]">{a.tipo}</td>
                <td className="border border-black py-1 px-1 text-center font-mono font-bold">{a.referencia}</td>
                <td className="border border-black py-1 px-1 text-center">{a.responsable}</td>
                <td className="border border-black py-1 px-2 text-left">{a.descripcion}</td>
                <td className="border border-black py-1 px-2 text-center font-mono font-semibold">{a.montoOImpacto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
