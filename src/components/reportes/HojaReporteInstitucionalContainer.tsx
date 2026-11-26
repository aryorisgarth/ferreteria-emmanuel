"use client";

import { Logo, MarcaAguaDocumento } from "@/components/marca/Logo";
import { fechaLarga } from "@/lib/format";
import type { ProductoVista } from "@/lib/types";
import type { ReporteDef } from "./tipos";
import { HojaInventarioReportes } from "./HojaInventarioReportes";
import { HojaVentasReportes } from "./HojaVentasReportes";
import { HojaComprasDevolucionesReportes } from "./HojaComprasDevolucionesReportes";
import { HojaFinanzasCarteraReportes } from "./HojaFinanzasCarteraReportes";

interface HojaReporteInstitucionalContainerProps {
  reporteActual: ReporteDef;
  empresaConfig?: any;
  simbolo: string;
  datosFiltrados: ProductoVista[];
  ventasPeriodo?: any;
  ventasProducto?: any;
  ventasCajero?: any;
  ventasMedioPago?: any;
  comprasProveedor?: any;
  devoluciones?: any;
  cuentasPorPagar?: any;
  cuentasPorCobrar?: any;
  cajaTurnos?: any;
  auditoria?: any;
}

export function HojaReporteInstitucionalContainer({
  reporteActual,
  empresaConfig,
  simbolo,
  datosFiltrados,
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
}: HojaReporteInstitucionalContainerProps) {
  return (
    <article className="hoja-reporte-institucional relative mx-auto w-full bg-white print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none">
      <MarcaAguaDocumento orientacion="horizontal" />

      <div className="relative z-10 w-full p-6 print:p-0">
        <header className="mb-4 text-center select-none print:mb-3">
          <div className="flex justify-center mb-1.5">
            <Logo variante="color" className="h-10 sm:h-12 w-auto mx-auto" />
          </div>
          <h1 className="font-sans text-[20px] sm:text-[22px] font-bold text-[#1e40af] tracking-wide leading-none mb-1">
            {reporteActual.titulo}
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            {empresaConfig?.nombre || "Ferretería Emmanuel S.A."} · RUC: {empresaConfig?.ruc || "J0310000000000"} · {fechaLarga(new Date().toISOString().slice(0, 10))}
          </p>
        </header>

        <HojaInventarioReportes
          reporteId={reporteActual.id}
          datosFiltrados={datosFiltrados}
          simbolo={simbolo}
        />

        <HojaVentasReportes
          reporteId={reporteActual.id}
          ventasPeriodo={ventasPeriodo}
          ventasProducto={ventasProducto}
          ventasCajero={ventasCajero}
          ventasMedioPago={ventasMedioPago}
          simbolo={simbolo}
        />

        <HojaComprasDevolucionesReportes
          reporteId={reporteActual.id}
          comprasProveedor={comprasProveedor}
          devoluciones={devoluciones}
          simbolo={simbolo}
        />

        <HojaFinanzasCarteraReportes
          reporteId={reporteActual.id}
          cuentasPorCobrar={cuentasPorCobrar}
          cuentasPorPagar={cuentasPorPagar}
          cajaTurnos={cajaTurnos}
          auditoria={auditoria}
          simbolo={simbolo}
        />
      </div>
    </article>
  );
}
