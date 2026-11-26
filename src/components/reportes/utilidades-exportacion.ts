import type { ProductoVista } from "@/lib/types";
import { etiquetaUnidad } from "@/lib/format";
import type { ReporteDef } from "./tipos";

interface OpcionesExportacion {
  reporteActual: ReporteDef;
  datosFiltrados: ProductoVista[];
  empresaConfig?: any;
  ventasPeriodo?: any;
  ventasProducto?: any;
  cuentasPorCobrar?: any;
  cuentasPorPagar?: any;
  cajaTurnos?: any;
  auditoria?: any;
}

function esc(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportarReporteExcel({
  reporteActual,
  datosFiltrados,
  empresaConfig,
}: OpcionesExportacion) {
  const nombreEmpresa = empresaConfig?.nombre || "FERRETERÍA EMMANUEL S.A.";
  const ruc = empresaConfig?.ruc || "J0310000000000";
  const fechaGen = new Date().toLocaleDateString("es-NI", {
    year: "numeric", month: "long", day: "numeric"
  });

  const totInicial = datosFiltrados.reduce((acc, p) => acc + (p.inventarioInicial || 0), 0);
  const totEntradas = datosFiltrados.reduce((acc, p) => acc + (p.totalEntradas || 0), 0);
  const totSalidas = datosFiltrados.reduce((acc, p) => acc + (p.totalSalidas || 0), 0);
  const totStock = datosFiltrados.reduce((acc, p) => acc + (p.stockActual || 0), 0);

  const cabecera = `
    <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 10pt; height: 38px; text-align: center; vertical-align: middle;">
      <th style="border: 1px solid #334155; padding: 8px 10px; width: 55px;">Item</th>
      <th style="border: 1px solid #334155; padding: 8px 12px; width: 130px;">Código</th>
      <th style="border: 1px solid #334155; padding: 8px 14px; text-align: left; width: 340px;">Artículo / Descripción</th>
      <th style="border: 1px solid #334155; padding: 8px 10px; width: 120px;">Marca</th>
      <th style="border: 1px solid #334155; padding: 8px 10px; width: 140px;">Categoría</th>
      <th style="border: 1px solid #334155; padding: 8px 10px; width: 90px;">Unidad</th>
      <th style="border: 1px solid #334155; padding: 8px 10px; width: 95px;">Inicial</th>
      <th style="border: 1px solid #334155; padding: 8px 10px; width: 95px;">Entradas</th>
      <th style="border: 1px solid #334155; padding: 8px 10px; width: 95px;">Salidas</th>
      <th style="border: 1px solid #334155; padding: 8px 10px; width: 110px;">Stock Actual</th>
      <th style="border: 1px solid #334155; padding: 8px 12px; text-align: left; width: 220px;">Observaciones</th>
    </tr>
  `;

  const filas = datosFiltrados.map((p, idx) => {
    const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    return `
      <tr style="background-color: ${bg}; font-size: 9.5pt; height: 32px; vertical-align: middle;">
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px 10px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; mso-number-format:'\\@'; padding: 7px 12px;">${esc(p.codigo)}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; font-weight: 500; padding: 7px 14px;">${esc(p.nombre)}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px 10px; color: #334155;">${esc(p.marca || "Genérica")}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px 10px; color: #334155;">${esc(p.categoria)}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px 10px;">${esc(etiquetaUnidad(p.unidadMedida))}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px 10px;">${p.inventarioInicial || 0}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px 10px;">${p.totalEntradas || 0}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 7px 10px;">${p.totalSalidas || 0}</td>
        <td style="border: 1px solid #93c5fd; text-align: center; font-weight: bold; background-color: #eff6ff; color: #1d4ed8; padding: 7px 10px;">${p.stockActual}</td>
        <td style="border: 1px solid #cbd5e1; padding: 7px 12px;"></td>
      </tr>
    `;
  }).join("");

  const totales = `
    <tr style="background-color: #e2e8f0; font-weight: bold; font-size: 9.5pt; height: 34px; vertical-align: middle;">
      <td colspan="6" style="border: 1.5pt solid #64748b; text-align: right; padding: 8px 14px; color: #0f172a;">TOTALES GENERALES (${datosFiltrados.length} ARTÍCULOS):</td>
      <td style="border: 1.5pt solid #64748b; text-align: center; padding: 8px 10px;">${totInicial}</td>
      <td style="border: 1.5pt solid #64748b; text-align: center; padding: 8px 10px;">${totEntradas}</td>
      <td style="border: 1.5pt solid #64748b; text-align: center; padding: 8px 10px;">${totSalidas}</td>
      <td style="border: 1.5pt solid #64748b; text-align: center; background-color: #dbeafe; color: #1e40af; font-size: 10.5pt; padding: 8px 10px;">${totStock}</td>
      <td style="border: 1.5pt solid #64748b; padding: 8px 12px;"></td>
    </tr>
  `;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${esc(reporteActual.titulo.slice(0, 30))}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; } table { border-collapse: collapse; }</style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="11" style="background-color: #0f172a; color: #ffffff; font-size: 15pt; font-weight: bold; text-align: center; height: 44px; vertical-align: middle;">
            ${esc(nombreEmpresa)}
          </td>
        </tr>
        <tr>
          <td colspan="11" style="background-color: #1e40af; color: #ffffff; font-size: 11pt; font-weight: bold; text-align: center; height: 32px; vertical-align: middle;">
            ${esc(reporteActual.titulo.toUpperCase())}
          </td>
        </tr>
        <tr>
          <td colspan="11" style="background-color: #f1f5f9; color: #475569; font-size: 9.5pt; font-style: italic; text-align: center; height: 28px; vertical-align: middle;">
            RUC: ${esc(ruc)} &nbsp;|&nbsp; Fecha de Generación: ${esc(fechaGen)} &nbsp;|&nbsp; Sistema de Control de Bodega y Existencias
          </td>
        </tr>
        <tr><td colspan="11" style="height: 14px;"></td></tr>
        ${cabecera}
        ${filas}
        ${totales}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reporteActual.titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
