"use client";

import { numero } from "@/lib/format";
import type { ReporteId } from "./tipos";
import { SeccionKardexEnlace } from "./SeccionKardexEnlace";
import { TablaArqueosAuditoriaReporte } from "./TablaArqueosAuditoriaReporte";

interface HojaFinanzasCarteraReportesProps {
  reporteId: ReporteId;
  cuentasPorCobrar?: any;
  cuentasPorPagar?: any;
  cajaTurnos?: any;
  auditoria?: any;
  simbolo: string;
}

export function HojaFinanzasCarteraReportes({
  reporteId,
  cuentasPorCobrar,
  cuentasPorPagar,
  cajaTurnos,
  auditoria,
  simbolo,
}: HojaFinanzasCarteraReportesProps) {
  if (reporteId === "arqueo_caja" || reporteId === "auditoria_trazabilidad") {
    return (
      <TablaArqueosAuditoriaReporte
        reporteId={reporteId}
        cajaTurnos={cajaTurnos}
        auditoria={auditoria}
      />
    );
  }

  if (reporteId === "cuentas_cobrar" && cuentasPorCobrar) {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-1">Factura</th>
              <th className="border border-black py-1 px-1">Fecha Emisión</th>
              <th className="border border-black py-1 px-2 text-left">Cliente</th>
              <th className="border border-black py-1 px-1">Cajero</th>
              <th className="border border-black py-1 px-1">Total Factura ({simbolo})</th>
              <th className="border border-black py-1 px-1">Saldo Pendiente ({simbolo})</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {cuentasPorCobrar.cuentas.map((c: any) => (
              <tr key={c.facturaId}>
                <td className="border border-black py-1 px-1 text-center font-mono font-bold">{c.numero}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{c.fecha}</td>
                <td className="border border-black py-1 px-2 text-left">{c.cliente}</td>
                <td className="border border-black py-1 px-1 text-center">{c.creadoPor}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(c.total)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono text-blue-700 font-bold">{numero(c.saldoPendiente)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (reporteId === "cuentas_pagar" && cuentasPorPagar) {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-1">Compra</th>
              <th className="border border-black py-1 px-1">Factura Prov.</th>
              <th className="border border-black py-1 px-2 text-left">Proveedor</th>
              <th className="border border-black py-1 px-1">Emisión</th>
              <th className="border border-black py-1 px-1">Vencimiento</th>
              <th className="border border-black py-1 px-1">Total Compra</th>
              <th className="border border-black py-1 px-1">Abonos</th>
              <th className="border border-black py-1 px-1">Saldo Adeudado ({simbolo})</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {cuentasPorPagar.cuentas.map((c: any) => (
              <tr key={c.compraId}>
                <td className="border border-black py-1 px-1 text-center font-mono font-bold">{c.numero}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{c.facturaProveedor || "N/A"}</td>
                <td className="border border-black py-1 px-2 text-left">{c.proveedor}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{c.fecha}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{c.fechaVencimiento}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(c.total)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono text-emerald-700">{numero(c.totalAbonado)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono text-rose-700 font-bold">{numero(c.saldoPendiente)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (reporteId === "kardex_movimientos") {
    return <SeccionKardexEnlace />;
  }

  return null;
}
