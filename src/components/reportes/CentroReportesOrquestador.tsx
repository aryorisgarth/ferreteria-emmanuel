"use client";

import { useMemo, useState } from "react";
import type { CentroReportesProps, ReporteId } from "./tipos";
import { REPORTES_DISPONIBLES } from "./catalogo-reportes";
import { exportarReporteExcel } from "./utilidades-exportacion";
import { BarraEncabezadoReporte } from "./BarraEncabezadoReporte";
import { SelectorReportesMenu } from "./SelectorReportesMenu";
import { FiltrosInventarioReporte } from "./FiltrosInventarioReporte";
import { HojaReporteInstitucionalContainer } from "./HojaReporteInstitucionalContainer";

export function CentroReportesOrquestador({
  productos,
  categoriasDisponibles,
  marcasDisponibles,
  simbolo = "C$",
  ventasPeriodo,
  ventasProducto,
  ventasCajero,
  ventasMedioPago,
  comprasProveedor,
  devoluciones,
  cuentasPorPagar,
  cuentasPorCobrar,
  cajaTurnos,
  auditoria,
  empresaConfig,
}: CentroReportesProps) {
  const [catSel, setCatSel] = useState<string>("TODOS");
  const [reporteSel, setReporteSel] = useState<ReporteId>("inventario_general");

  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filtroMarca, setFiltroMarca] = useState("TODAS");
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const reporteActual = useMemo(
    () => REPORTES_DISPONIBLES.find((r) => r.id === reporteSel) || REPORTES_DISPONIBLES[0],
    [reporteSel]
  );

  const reportesFiltrados = useMemo(() => {
    if (catSel === "TODOS") return REPORTES_DISPONIBLES;
    return REPORTES_DISPONIBLES.filter((r) => r.categoria === catSel);
  }, [catSel]);

  const datosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const matchCat = filtroCategoria === "TODAS" || p.categoria === filtroCategoria;
      const matchMarca = filtroMarca === "TODAS" || (p.marca || "Genérica") === filtroMarca;
      const matchBajo = !soloStockBajo || p.stockActual <= p.stockMinimo;
      const matchTexto =
        !q ||
        p.codigo.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q);
      return p.activo && matchCat && matchMarca && matchBajo && matchTexto;
    });
  }, [productos, filtroCategoria, filtroMarca, soloStockBajo, busqueda]);

  const onExportarExcel = () => {
    exportarReporteExcel({
      reporteActual,
      datosFiltrados,
      empresaConfig,
      ventasPeriodo,
      ventasProducto,
      cuentasPorCobrar,
      cuentasPorPagar,
      cajaTurnos,
      auditoria,
    });
  };

  const esReporteInventario = ["inventario_general", "lista_precios", "toma_fisica", "inventario_valorizado"].includes(
    reporteActual.id
  );

  return (
    <div className="space-y-6 print:space-y-0 print:m-0 print:p-0">
      <div className="no-print space-y-4">
        <BarraEncabezadoReporte
          reporteActual={reporteActual}
          onExportarExcel={onExportarExcel}
          onImprimir={() => window.print()}
        />

        <SelectorReportesMenu
          catSel={catSel}
          setCatSel={setCatSel}
          reporteSel={reporteSel}
          setReporteSel={setReporteSel}
          reportesFiltrados={reportesFiltrados}
        />

        {esReporteInventario && (
          <FiltrosInventarioReporte
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
            categoriasDisponibles={categoriasDisponibles}
            filtroMarca={filtroMarca}
            setFiltroMarca={setFiltroMarca}
            marcasDisponibles={marcasDisponibles}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            soloStockBajo={soloStockBajo}
            setSoloStockBajo={setSoloStockBajo}
            totalArticulos={datosFiltrados.length}
          />
        )}
      </div>

      <HojaReporteInstitucionalContainer
        reporteActual={reporteActual}
        empresaConfig={empresaConfig}
        simbolo={simbolo}
        datosFiltrados={datosFiltrados}
        ventasPeriodo={ventasPeriodo}
        ventasProducto={ventasProducto}
        ventasCajero={ventasCajero}
        ventasMedioPago={ventasMedioPago}
        comprasProveedor={comprasProveedor}
        devoluciones={devoluciones}
        cuentasPorPagar={cuentasPorPagar}
        cuentasPorCobrar={cuentasPorCobrar}
        cajaTurnos={cajaTurnos}
        auditoria={auditoria}
      />
    </div>
  );
}
