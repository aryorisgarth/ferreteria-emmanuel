import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { BotonImprimir } from "@/components/documentos/Imprimir";
import { PlantillaReporteInstitucional } from "@/components/reportes/PlantillaReporteInstitucional";
import { etiquetaUnidad, numero } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Reporte Institucional de Inventario" };

type ModoReporte = "precios" | "general" | "toma_fisica" | "valorizado";

export default async function InventarioImpresion({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; categoria?: string; marca?: string; stockCritico?: string }>;
}) {
  const sp = await searchParams;
  const modo: ModoReporte = (
    sp.modo === "general" || sp.modo === "toma_fisica" || sp.modo === "valorizado" ? sp.modo : "precios"
  );
  const categoriaSel = sp.categoria || "TODAS";
  const marcaSel = sp.marca || "TODAS";
  const soloStockCritico = sp.stockCritico === "1";

  const [todos, config] = await Promise.all([
    api.catalogo(),
    obtenerConfiguracion(),
  ]);

  const simbolo = config.moneda.simbolo;

  // Filtrar artículos reales
  const productos = todos.filter((p) => {
    const matchCat = categoriaSel === "TODAS" || p.categoria === categoriaSel;
    const matchMarca = marcaSel === "TODAS" || (p.marca || "Genérica") === marcaSel;
    const matchCritico = !soloStockCritico || p.stockActual <= p.stockMinimo;
    return p.activo && matchCat && matchMarca && matchCritico;
  });

  const titulosModo: Record<ModoReporte, string> = {
    general: "Inventario inicial",
    precios: "Lista oficial de precios al público",
    toma_fisica: "Toma física de existencias",
    valorizado: "Inventario valorizado al costo promedio (CPP)",
  };

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Barra de control mínima en pantalla (oculta al imprimir) */}
      <div className="no-print mx-auto max-w-[11in] px-4 py-2 flex items-center justify-between border-b border-slate-200 text-xs">
        <Link
          className="flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-900 transition"
          href="/reportes"
        >
          <ArrowLeft size={14} />
          Volver a Reportes
        </Link>
        <BotonImprimir>
          <Printer size={14} />
          Imprimir Documento (Ctrl + P)
        </BotonImprimir>
      </div>

      <PlantillaReporteInstitucional titulo={titulosModo[modo]} orientacion="horizontal">
        {/* MODO 1: INVENTARIO GENERAL (IDÉNTICO A LA IMAGEN DE REFERENCIA) */}
        {modo === "general" && (
          <table
            className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "33%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "7.5%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "7.5%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
                <th className="border border-black py-1 px-1 font-bold">Item</th>
                <th className="border border-black py-1 px-1 font-bold">Código</th>
                <th className="border border-black py-1 px-2 text-left font-bold">Articulo</th>
                <th className="border border-black py-1 px-1 text-center font-bold">
                  Unidad<br />de medida
                </th>
                <th className="border border-black py-1 px-1 text-center font-bold">
                  Cantidad<br />inicial
                </th>
                <th className="border border-black py-1 px-1 text-center font-bold">
                  Cantidad<br />entrada
                </th>
                <th className="border border-black py-1 px-1 text-center font-bold">
                  Fecha<br />entrada
                </th>
                <th className="border border-black py-1 px-1 text-center font-bold">
                  Cantidad<br />salida
                </th>
                <th className="border border-black py-1 px-1 text-center font-bold">
                  Fecha<br />salida
                </th>
                <th className="border border-black py-1 px-1 text-center font-bold">
                  Disponibilidad
                </th>
                <th className="border border-black py-1 px-2 text-left font-bold">
                  Observaciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent text-black text-[10px]">
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-slate-400 border border-black">
                    No se encontraron artículos.
                  </td>
                </tr>
              ) : (
                productos.map((p, idx) => {
                  const tieneSalida = (p.totalSalidas || 0) > 0;
                  const tieneEntrada = (p.totalEntradas || 0) > 0;
                  const esStockCritico = p.stockActual <= p.stockMinimo;

                  return (
                    <tr key={p.id} className="bg-transparent hover:bg-slate-50/40">
                      <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{idx + 1}</td>
                      <td className="border border-black py-1 px-1 text-center whitespace-nowrap font-medium">{p.codigo}</td>
                      <td className="border border-black py-1 px-2 text-left leading-tight truncate" title={`${p.nombre} ${p.marca ? `(${p.marca})` : ""}`}>
                        {p.nombre} {p.marca ? `(${p.marca})` : ""}
                      </td>
                      <td className="border border-black py-1 px-1 text-center whitespace-nowrap">
                        {etiquetaUnidad(p.unidadMedida)}
                      </td>
                      <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{p.inventarioInicial || 0}</td>
                      <td className="border border-black py-1 px-1 text-center whitespace-nowrap">
                        {tieneEntrada ? p.totalEntradas : ""}
                      </td>
                      <td className="border border-black py-1 px-1 text-center whitespace-nowrap text-[9.5px]">
                        {tieneEntrada ? "Ver Kárdex" : ""}
                      </td>
                      <td className="border border-black py-1 px-1 text-center whitespace-nowrap">
                        {tieneSalida ? p.totalSalidas : ""}
                      </td>
                      <td className="border border-black py-1 px-1 text-center whitespace-nowrap text-[9.5px]">
                        {tieneSalida ? "Ver Kárdex" : ""}
                      </td>
                      <td className="border border-black py-1 px-1 text-center whitespace-nowrap font-medium">{p.stockActual}</td>
                      <td className="border border-black py-1 px-2 text-left leading-tight text-[9.5px]">
                        {esStockCritico ? "Stock mínimo superado" : ""}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* MODO 2: LISTA DE PRECIOS */}
        {modo === "precios" && (
          <table
            className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "37%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
                <th className="border border-black py-1 px-1 font-bold">Item</th>
                <th className="border border-black py-1 px-1 font-bold">Código</th>
                <th className="border border-black py-1 px-2 text-left font-bold">Articulo</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Categoría</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Marca</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Unidad de medida</th>
                <th className="border border-black py-1 px-2 text-center font-bold">
                  Precio venta ({simbolo})
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent text-black text-[10px]">
              {productos.map((p, idx) => (
                <tr key={p.id} className="bg-transparent hover:bg-slate-50/40">
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{idx + 1}</td>
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap font-medium">{p.codigo}</td>
                  <td className="border border-black py-1 px-2 text-left leading-tight truncate">{p.nombre}</td>
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{p.categoria}</td>
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{p.marca || "Genérica"}</td>
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{etiquetaUnidad(p.unidadMedida)}</td>
                  <td className="border border-black py-1 px-2 text-center whitespace-nowrap font-medium">{numero(p.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* MODO 3: TOMA FÍSICA */}
        {modo === "toma_fisica" && (
          <table
            className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "35%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
            </colgroup>
            <thead>
              <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
                <th className="border border-black py-1 px-1 font-bold">Item</th>
                <th className="border border-black py-1 px-1 font-bold">Código</th>
                <th className="border border-black py-1 px-2 text-left font-bold">Articulo</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Unidad de medida</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Mínimo</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Stock sistema</th>
                <th className="border border-black py-1 px-1 text-center font-bold">
                  Conteo físico
                </th>
                <th className="border border-black py-1 px-2 text-left font-bold">Observaciones</th>
              </tr>
            </thead>
            <tbody className="bg-transparent text-black text-[10px]">
              {productos.map((p, idx) => (
                <tr key={p.id} className="bg-transparent hover:bg-slate-50/40">
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{idx + 1}</td>
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap font-medium">{p.codigo}</td>
                  <td className="border border-black py-1 px-2 text-left leading-tight truncate">{p.nombre} {p.marca ? `(${p.marca})` : ""}</td>
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{etiquetaUnidad(p.unidadMedida)}</td>
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{numero(p.stockMinimo)}</td>
                  <td className="border border-black py-1 px-1 text-center whitespace-nowrap font-medium">{numero(p.stockActual)}</td>
                  <td className="border border-black py-1 px-1 text-center">{/* Conteo en blanco */}</td>
                  <td className="border border-black py-1 px-2 text-left text-[9.5px]">
                    {p.stockActual <= p.stockMinimo ? "Reorden urgente" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* MODO 4: INVENTARIO VALORIZADO */}
        {modo === "valorizado" && (
          <table
            className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-[10px]"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "35%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr className="bg-black text-white text-[10px] font-bold text-center leading-tight">
                <th className="border border-black py-1 px-1 font-bold">Item</th>
                <th className="border border-black py-1 px-1 font-bold">Código</th>
                <th className="border border-black py-1 px-2 text-left font-bold">Articulo</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Unidad de medida</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Disponibilidad</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Costo CPP ({simbolo})</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Valuación ({simbolo})</th>
                <th className="border border-black py-1 px-1 text-center font-bold">Precio venta ({simbolo})</th>
              </tr>
            </thead>
            <tbody className="bg-transparent text-black text-[10px]">
              {productos.map((p, idx) => {
                const cUnit = p.costo || p.precio * 0.7;
                const valTot = p.stockActual * cUnit;

                return (
                  <tr key={p.id} className="bg-transparent hover:bg-slate-50/40">
                    <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{idx + 1}</td>
                    <td className="border border-black py-1 px-1 text-center whitespace-nowrap font-medium">{p.codigo}</td>
                    <td className="border border-black py-1 px-2 text-left leading-tight truncate">{p.nombre} {p.marca ? `(${p.marca})` : ""}</td>
                    <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{etiquetaUnidad(p.unidadMedida)}</td>
                    <td className="border border-black py-1 px-1 text-center whitespace-nowrap font-medium">{numero(p.stockActual)}</td>
                    <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{numero(cUnit)}</td>
                    <td className="border border-black py-1 px-1 text-center whitespace-nowrap font-medium">
                      {numero(valTot)}
                    </td>
                    <td className="border border-black py-1 px-1 text-center whitespace-nowrap">{numero(p.precio)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </PlantillaReporteInstitucional>
    </div>
  );
}
