"use client";

import { dinero, numero } from "@/lib/format";

export function TablaVentasPeriodo({ ventasPeriodo }: { ventasPeriodo: any }) {
  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
        <div>
          <span className="text-slate-500 font-bold uppercase text-[10px]">Facturas Emitidas</span>
          <p className="text-base font-bold font-mono text-slate-900">{ventasPeriodo.resumen.totalFacturas}</p>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase text-[10px]">Total Ventas Netas</span>
          <p className="text-base font-bold font-mono text-slate-900">{dinero(ventasPeriodo.resumen.totalSubtotal)}</p>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase text-[10px]">Costo Mercadería</span>
          <p className="text-base font-bold font-mono text-rose-700">{dinero(ventasPeriodo.resumen.totalCostoVenta)}</p>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase text-[10px]">Utilidad Bruta Real</span>
          <p className="text-base font-bold font-mono text-emerald-700">{dinero(ventasPeriodo.resumen.totalUtilidadBruta)}</p>
        </div>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-1">Número</th>
              <th className="border border-black py-1 px-1">Fecha</th>
              <th className="border border-black py-1 px-2 text-left">Cliente</th>
              <th className="border border-black py-1 px-1">Pago</th>
              <th className="border border-black py-1 px-1">Cajero</th>
              <th className="border border-black py-1 px-1">Subtotal</th>
              <th className="border border-black py-1 px-1">IVA</th>
              <th className="border border-black py-1 px-1">Total</th>
              <th className="border border-black py-1 px-1">Costo Venta</th>
              <th className="border border-black py-1 px-1">Utilidad Bruta</th>
              <th className="border border-black py-1 px-1">Margen</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {ventasPeriodo.renglones.map((f: any) => (
              <tr key={f.facturaId}>
                <td className="border border-black py-1 px-1 text-center font-mono font-bold">{f.numero}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{f.fecha}</td>
                <td className="border border-black py-1 px-2 text-left truncate max-w-[140px]">{f.cliente}</td>
                <td className="border border-black py-1 px-1 text-center">{f.formaPago}</td>
                <td className="border border-black py-1 px-1 text-center">{f.creadoPor}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(f.subtotal)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono">{numero(f.iva)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono font-bold">{numero(f.total)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono text-rose-700">{numero(f.costoVenta)}</td>
                <td className="border border-black py-1 px-1 text-right font-mono text-emerald-700 font-bold">{numero(f.utilidadBruta)}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{f.margenPorcentaje}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
