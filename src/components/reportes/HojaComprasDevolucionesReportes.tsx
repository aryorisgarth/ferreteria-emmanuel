"use client";

import { numero } from "@/lib/format";
import type { ReporteId } from "./tipos";

interface HojaComprasDevolucionesReportesProps {
  reporteId: ReporteId;
  comprasProveedor?: any;
  devoluciones?: any;
  simbolo: string;
}

export function HojaComprasDevolucionesReportes({
  reporteId,
  comprasProveedor,
  devoluciones,
  simbolo,
}: HojaComprasDevolucionesReportesProps) {
  if (reporteId === "compras_proveedor" && comprasProveedor) {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-2 text-left">Proveedor</th>
              <th className="border border-black py-1 px-1">Compras Registradas</th>
              <th className="border border-black py-1 px-1">Total Comprado ({simbolo})</th>
              <th className="border border-black py-1 px-1">Saldo Pendiente (CxP)</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {comprasProveedor.proveedores.map((p: any) => (
              <tr key={p.proveedor}>
                <td className="border border-black py-1 px-2 text-left font-bold">{p.proveedor}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{p.cantidadCompras}</td>
                <td className="border border-black py-1 px-1 text-right font-mono font-bold">{numero(p.totalComprado)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono text-rose-700 font-bold">{numero(p.saldoPendiente)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (reporteId === "devoluciones" && devoluciones) {
    return (
      <div className="w-full space-y-6">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">Devoluciones de Clientes</h3>
          <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
            <thead>
              <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
                <th className="border border-black py-1 px-1">Número</th>
                <th className="border border-black py-1 px-1">Fecha</th>
                <th className="border border-black py-1 px-2 text-left">Cliente</th>
                <th className="border border-black py-1 px-1">Factura Origen</th>
                <th className="border border-black py-1 px-2 text-left">Motivo</th>
                <th className="border border-black py-1 px-1">Método</th>
                <th className="border border-black py-1 px-1">Total Reintegro ({simbolo})</th>
              </tr>
            </thead>
            <tbody className="bg-transparent text-black text-[10px]">
              {devoluciones.devolucionesClientes.map((d: any) => (
                <tr key={d.id}>
                  <td className="border border-black py-1 px-1 text-center font-mono font-bold">{d.numero}</td>
                  <td className="border border-black py-1 px-1 text-center font-mono">{d.fecha}</td>
                  <td className="border border-black py-1 px-2 text-left">{d.cliente}</td>
                  <td className="border border-black py-1 px-1 text-center font-mono">{d.facturaNumero}</td>
                  <td className="border border-black py-1 px-2 text-left">{d.motivo}</td>
                  <td className="border border-black py-1 px-1 text-center">{d.metodoReintegro}</td>
                  <td className="border border-black py-1 px-1 text-right font-mono font-bold text-rose-700">{numero(d.totalReintegro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">Devoluciones a Proveedores</h3>
          <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
            <thead>
              <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
                <th className="border border-black py-1 px-1">Número</th>
                <th className="border border-black py-1 px-1">Fecha</th>
                <th className="border border-black py-1 px-2 text-left">Proveedor</th>
                <th className="border border-black py-1 px-2 text-left">Motivo</th>
                <th className="border border-black py-1 px-1">Total Descuento ({simbolo})</th>
              </tr>
            </thead>
            <tbody className="bg-transparent text-black text-[10px]">
              {devoluciones.devolucionesProveedores.map((d: any) => (
                <tr key={d.id}>
                  <td className="border border-black py-1 px-1 text-center font-mono font-bold">{d.numero}</td>
                  <td className="border border-black py-1 px-1 text-center font-mono">{d.fecha}</td>
                  <td className="border border-black py-1 px-2 text-left">{d.proveedor}</td>
                  <td className="border border-black py-1 px-2 text-left">{d.motivo}</td>
                  <td className="border border-black py-1 px-1 text-right font-mono font-bold text-emerald-700">{numero(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
