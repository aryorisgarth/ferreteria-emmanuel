"use client";

import { etiquetaUnidad, numero } from "@/lib/format";
import type { ProductoVista } from "@/lib/types";
import type { ReporteId } from "./tipos";
import { TablaListaPreciosTomaFisica } from "./TablaListaPreciosTomaFisica";

interface HojaInventarioReportesProps {
  reporteId: ReporteId;
  datosFiltrados: ProductoVista[];
  simbolo: string;
}

export function HojaInventarioReportes({
  reporteId,
  datosFiltrados,
  simbolo,
}: HojaInventarioReportesProps) {
  if (reporteId === "lista_precios" || reporteId === "toma_fisica") {
    return (
      <TablaListaPreciosTomaFisica
        reporteId={reporteId}
        datosFiltrados={datosFiltrados}
        simbolo={simbolo}
      />
    );
  }

  if (reporteId === "inventario_general") {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10.5px]">
          <thead>
            <tr className="bg-black text-white text-[10.5px] font-bold text-center leading-tight">
              <th className="border border-black py-1.5 px-1.5 w-10">Item</th>
              <th className="border border-black py-1.5 px-2 w-28">Código</th>
              <th className="border border-black py-1.5 px-3 text-left">Artículo / Descripción</th>
              <th className="border border-black py-1.5 px-2 w-24">Marca</th>
              <th className="border border-black py-1.5 px-2 w-28">Categoría</th>
              <th className="border border-black py-1.5 px-1.5 text-center w-20">Unidad</th>
              <th className="border border-black py-1.5 px-1.5 text-center w-20">Inicial</th>
              <th className="border border-black py-1.5 px-1.5 text-center w-20">Entradas</th>
              <th className="border border-black py-1.5 px-1.5 text-center w-20">Salidas</th>
              <th className="border border-black py-1.5 px-2 text-center w-24">Stock Actual</th>
              <th className="border border-black py-1.5 px-2.5 text-left w-36">Observaciones</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10.5px]">
            {datosFiltrados.map((p, idx) => (
              <tr key={p.id} className="hover:bg-slate-50/40">
                <td className="border border-black py-1 px-1.5 text-center">{idx + 1}</td>
                <td className="border border-black py-1 px-2 text-center font-mono font-medium">{p.codigo}</td>
                <td className="border border-black py-1 px-3 text-left font-semibold">{p.nombre}</td>
                <td className="border border-black py-1 px-2 text-center text-slate-700">{p.marca || "Genérica"}</td>
                <td className="border border-black py-1 px-2 text-center text-slate-700">{p.categoria}</td>
                <td className="border border-black py-1 px-1.5 text-center">{etiquetaUnidad(p.unidadMedida)}</td>
                <td className="border border-black py-1 px-1.5 text-center font-mono">{p.inventarioInicial || 0}</td>
                <td className="border border-black py-1 px-1.5 text-center font-mono">{p.totalEntradas || 0}</td>
                <td className="border border-black py-1 px-1.5 text-center font-mono">{p.totalSalidas || 0}</td>
                <td className="border border-black py-1 px-2 text-center font-bold font-mono text-[11px]">{p.stockActual}</td>
                <td className="border border-black py-1 px-2 min-w-[120px]"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (reporteId === "inventario_valorizado") {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-1">Item</th>
              <th className="border border-black py-1 px-1">Código</th>
              <th className="border border-black py-1 px-2 text-left">Artículo</th>
              <th className="border border-black py-1 px-1">Unidad</th>
              <th className="border border-black py-1 px-1">Existencia</th>
              <th className="border border-black py-1 px-1">Costo CPP ({simbolo})</th>
              <th className="border border-black py-1 px-1">Valor Patrimonial ({simbolo})</th>
              <th className="border border-black py-1 px-1">Precio Venta ({simbolo})</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {datosFiltrados.map((p, idx) => (
              <tr key={p.id}>
                <td className="border border-black py-1 px-1 text-center">{idx + 1}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{p.codigo}</td>
                <td className="border border-black py-1 px-2 text-left">{p.nombre}</td>
                <td className="border border-black py-1 px-1 text-center">{etiquetaUnidad(p.unidadMedida)}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{p.stockActual}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{numero(p.costo || 0)}</td>
                <td className="border border-black py-1 px-1 text-center font-mono font-bold">{numero(p.stockActual * (p.costo || 0))}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{numero(p.precio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
