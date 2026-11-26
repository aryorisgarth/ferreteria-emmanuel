"use client";

import { numero } from "@/lib/format";
import type { ReporteId } from "./tipos";
import { TablaVentasPeriodo } from "./TablaVentasPeriodo";

interface HojaVentasReportesProps {
  reporteId: ReporteId;
  ventasPeriodo?: any;
  ventasProducto?: any;
  ventasCajero?: any;
  ventasMedioPago?: any;
  simbolo: string;
}

export function HojaVentasReportes({
  reporteId,
  ventasPeriodo,
  ventasProducto,
  ventasCajero,
  ventasMedioPago,
  simbolo,
}: HojaVentasReportesProps) {
  if (reporteId === "ventas_periodo" && ventasPeriodo) {
    return <TablaVentasPeriodo ventasPeriodo={ventasPeriodo} />;
  }

  if (reporteId === "ventas_producto" && ventasProducto) {
    return (
      <div className="w-full space-y-4">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
            <thead>
              <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
                <th className="border border-black py-1 px-1">Item</th>
                <th className="border border-black py-1 px-1">Código</th>
                <th className="border border-black py-1 px-2 text-left">Artículo</th>
                <th className="border border-black py-1 px-1">Categoría</th>
                <th className="border border-black py-1 px-1">Unidades</th>
                <th className="border border-black py-1 px-1">Total Facturado</th>
                <th className="border border-black py-1 px-1">Costo Histórico</th>
                <th className="border border-black py-1 px-1">Utilidad Bruta</th>
                <th className="border border-black py-1 px-1">Margen %</th>
              </tr>
            </thead>
            <tbody className="bg-transparent text-black text-[10px]">
              {ventasProducto.productos.map((p: any, idx: number) => (
                <tr key={p.productoId}>
                  <td className="border border-black py-1 px-1 text-center">{idx + 1}</td>
                  <td className="border border-black py-1 px-1 text-center font-mono">{p.codigo}</td>
                  <td className="border border-black py-1 px-2 text-left">{p.nombre}</td>
                  <td className="border border-black py-1 px-1 text-center">{p.categoria}</td>
                  <td className="border border-black py-1 px-1 text-center font-mono font-bold">{p.unidadesVendidas}</td>
                  <td className="border border-black py-1 px-1 text-right font-mono">{numero(p.montoTotalVendido)}</td>
                  <td className="border border-black py-1 px-1 text-right font-mono text-rose-700">{numero(p.costoTotalHistorico)}</td>
                  <td className="border border-black py-1 px-1 text-right font-mono text-emerald-700 font-bold">{numero(p.utilidadBruta)}</td>
                  <td className="border border-black py-1 px-1 text-center font-mono">{p.margenPorcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (reporteId === "ventas_cajero" && ventasCajero) {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-2 text-left">Cajero / Usuario</th>
              <th className="border border-black py-1 px-1">Facturas</th>
              <th className="border border-black py-1 px-1">Total Facturado</th>
              <th className="border border-black py-1 px-1">Ticket Promedio</th>
              <th className="border border-black py-1 px-1">Efectivo</th>
              <th className="border border-black py-1 px-1">Transferencia</th>
              <th className="border border-black py-1 px-1">Tarjeta</th>
              <th className="border border-black py-1 px-1">Crédito</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {ventasCajero.cajeros.map((c: any) => (
              <tr key={c.cajero}>
                <td className="border border-black py-1 px-2 text-left font-bold">{c.cajero}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{c.cantidadFacturas}</td>
                <td className="border border-black py-1 px-1 text-right font-mono font-bold">{numero(c.totalVendido)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(c.ticketPromedio)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(c.efectivo)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(c.transferencia)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(c.tarjeta)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(c.credito)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (reporteId === "ventas_medio_pago" && ventasMedioPago) {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-2 text-left">Medio de Pago</th>
              <th className="border border-black py-1 px-1">Operaciones</th>
              <th className="border border-black py-1 px-1">Monto Recaudado ({simbolo})</th>
              <th className="border border-black py-1 px-1">Participación (%)</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {Object.entries(ventasMedioPago.medios).map(([k, v]: [string, any]) => (
              <tr key={k}>
                <td className="border border-black py-1 px-2 text-left font-bold">{k}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{v.cantidad}</td>
                <td className="border border-black py-1 px-1 text-right font-mono font-bold">{numero(v.total)}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{v.porcentaje}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
