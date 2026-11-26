"use client";

import { etiquetaUnidad, numero } from "@/lib/format";
import type { ProductoVista } from "@/lib/types";

interface TablaListaPreciosTomaFisicaProps {
  reporteId: "lista_precios" | "toma_fisica";
  datosFiltrados: ProductoVista[];
  simbolo: string;
}

export function TablaListaPreciosTomaFisica({
  reporteId,
  datosFiltrados,
  simbolo,
}: TablaListaPreciosTomaFisicaProps) {
  if (reporteId === "lista_precios") {
    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
          <thead>
            <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
              <th className="border border-black py-1 px-1">Item</th>
              <th className="border border-black py-1 px-1">Código</th>
              <th className="border border-black py-1 px-2 text-left">Artículo</th>
              <th className="border border-black py-1 px-1">Categoría</th>
              <th className="border border-black py-1 px-1">Marca</th>
              <th className="border border-black py-1 px-1">Unidad</th>
              <th className="border border-black py-1 px-2 text-center">Precio Venta ({simbolo})</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-[10px]">
            {datosFiltrados.map((p, idx) => (
              <tr key={p.id}>
                <td className="border border-black py-1 px-1 text-center">{idx + 1}</td>
                <td className="border border-black py-1 px-1 text-center font-mono">{p.codigo}</td>
                <td className="border border-black py-1 px-2 text-left">{p.nombre}</td>
                <td className="border border-black py-1 px-1 text-center">{p.categoria}</td>
                <td className="border border-black py-1 px-1 text-center">{p.marca || "Genérica"}</td>
                <td className="border border-black py-1 px-1 text-center">{etiquetaUnidad(p.unidadMedida)}</td>
                <td className="border border-black py-1 px-2 text-center font-bold font-mono">{numero(p.precio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto print:overflow-visible">
      <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]">
        <thead>
          <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
            <th className="border border-black py-1 px-1">Item</th>
            <th className="border border-black py-1 px-1">Código</th>
            <th className="border border-black py-1 px-2 text-left">Artículo</th>
            <th className="border border-black py-1 px-1">Unidad</th>
            <th className="border border-black py-1 px-1">Stock Sistema</th>
            <th className="border border-black py-1 px-2 text-center">Conteo Físico Real</th>
            <th className="border border-black py-1 px-2 text-left">Observaciones</th>
          </tr>
        </thead>
        <tbody className="bg-transparent text-black text-[10px]">
          {datosFiltrados.map((p, idx) => (
            <tr key={p.id}>
              <td className="border border-black py-1 px-1 text-center">{idx + 1}</td>
              <td className="border border-black py-1 px-1 text-center font-mono">{p.codigo}</td>
              <td className="border border-black py-1 px-2 text-left">{p.nombre} {p.marca ? `(${p.marca})` : ""}</td>
              <td className="border border-black py-1 px-1 text-center">{etiquetaUnidad(p.unidadMedida)}</td>
              <td className="border border-black py-1 px-1 text-center font-bold font-mono">{p.stockActual}</td>
              <td className="border border-black py-2 px-2 text-center font-mono bg-slate-50/20"></td>
              <td className="border border-black py-1 px-2 text-left text-[9.5px]"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
