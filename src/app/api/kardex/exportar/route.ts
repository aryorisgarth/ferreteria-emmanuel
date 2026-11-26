import { NextResponse } from "next/server";
import * as api from "@/lib/inventory/api";
import { fechaCorta } from "@/lib/format";
import type { OrigenMovimiento, TipoMovimiento } from "@/lib/types";
import { exigirSesion } from "@/lib/auth";

function escaparXml(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(request: Request) {
  try {
    await exigirSesion(["ADMINISTRADOR"]);
  } catch {
    return NextResponse.json(
      { error: "Acceso denegado: Se requiere rol de Administrador para exportar el Kárdex de valuación y movimientos." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);

  const productoId = searchParams.get("producto") || undefined;
  const codigo = searchParams.get("codigo") || undefined;
  const codigoBarras = searchParams.get("codigoBarras") || undefined;
  const desde = searchParams.get("desde") || undefined;
  const hasta = searchParams.get("hasta") || undefined;
  const tipo = (searchParams.get("tipo") || undefined) as TipoMovimiento | undefined;
  const origen = (searchParams.get("origen") || undefined) as OrigenMovimiento | undefined;
  const referencia = searchParams.get("referencia") || undefined;
  const busqueda = searchParams.get("busqueda") || undefined;
  const soloAuditoria = searchParams.get("auditoria") === "1";

  const [hoja, productoSel] = await Promise.all([
    api.kardex({
      productoId,
      codigo,
      codigoBarras,
      desde,
      hasta,
      tipo,
      origen,
      referencia,
      busqueda,
      soloAuditoria,
      page: "todas",
    }),
    productoId ? api.producto(productoId) : Promise.resolve(null),
  ]);

  const movimientos = hoja.rows;
  const hoyIso = new Date().toISOString().slice(0, 10);
  const horaActual = new Date().toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" });

  const totalEntradas = movimientos.reduce((acc, m) => acc + (m.entradas || 0), 0);
  const totalSalidas = movimientos.reduce((acc, m) => acc + (m.salidas || 0), 0);
  const saldoFinal = movimientos.length > 0 ? movimientos[movimientos.length - 1].stockSaldo : 0;

  // Construcción de SpreadsheetML (XML nativo de Microsoft Excel)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Kárdex de Inventario - Ferretería Emmanuel</Title>
  <Author>Ferretería Emmanuel</Author>
  <Created>${hoyIso}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="EmpresaTitulo">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DocumentoTitulo">
   <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="MetaValor">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="HeaderCol">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="FilaNormal">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
  </Style>
  <Style ss:ID="FilaNumero">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
  </Style>
  <Style ss:ID="FilaEntrada">
   <Font ss:Color="#047857" ss:Bold="1"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
  </Style>
  <Style ss:ID="FilaSalida">
   <Font ss:Color="#B91C1C" ss:Bold="1"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
  </Style>
  <Style ss:ID="FilaSaldo">
   <Font ss:Color="#0F172A" ss:Bold="1"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
  </Style>
  <Style ss:ID="FilaCentro">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalLabel">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#94A3B8"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalNum">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#94A3B8"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#94A3B8"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Kárdex de Inventario">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="75"/>  <!-- Fecha -->
   <Column ss:Width="45"/>  <!-- Hora -->
   <Column ss:Width="95"/>  <!-- Folio -->
   <Column ss:Width="85"/>  <!-- Código -->
   <Column ss:Width="200"/> <!-- Descripción -->
   <Column ss:Width="65"/>  <!-- U.M. -->
   <Column ss:Width="75"/>  <!-- Origen -->
   <Column ss:Width="70"/>  <!-- Tipo -->
   <Column ss:Width="85"/>  <!-- Entrada -->
   <Column ss:Width="85"/>  <!-- Salida -->
   <Column ss:Width="85"/>  <!-- Saldo -->
   <Column ss:Width="140"/> <!-- Destino -->
   <Column ss:Width="180"/> <!-- Concepto -->
   <Column ss:Width="90"/>  <!-- Responsable -->

   <!-- ENCABEZADO INSTITUCIONAL -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="13" ss:StyleID="EmpresaTitulo">
     <Data ss:Type="String">FERRETERÍA EMMANUEL · RUC: J0310000000000</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="13" ss:StyleID="DocumentoTitulo">
     <Data ss:Type="String">KÁRDEX OFICIAL DE INVENTARIO</Data>
    </Cell>
   </Row>
   <Row ss:Height="16">
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Artículo:</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="MetaValor">
     <Data ss:Type="String">${escaparXml(productoSel ? `${productoSel.codigo} - ${productoSel.nombre}` : "Todos los artículos del catálogo")}</Data>
    </Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Período:</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="MetaValor">
     <Data ss:Type="String">${escaparXml(desde || hasta ? `Del ${desde || "Inicio"} al ${hasta || "Actualidad"}` : "Histórico completo")}</Data>
    </Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Emisión:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaValor">
     <Data ss:Type="String">${hoyIso} ${horaActual}</Data>
    </Cell>
   </Row>
   <Row ss:Height="10"/>

   <!-- CABECERAS DE COLUMNAS -->
   <Row ss:Height="24">
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Fecha</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Hora</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Folio / Ref</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Código</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Descripción del Producto</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">U.M.</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Origen</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Tipo</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Entrada</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Salida</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Stock Saldo</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Destinatario / Entidad</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Concepto</Data></Cell>
    <Cell ss:StyleID="HeaderCol"><Data ss:Type="String">Responsable</Data></Cell>
   </Row>

   <!-- FILAS DE DATOS -->
   ${movimientos
     .map((m) => {
       const hora = m.createdAt ? m.createdAt.slice(11, 16) : "";
       const destino = [m.destinatario, m.oficinaNombre].filter(Boolean).join(" · ");
       return `
   <Row ss:Height="18">
    <Cell ss:StyleID="FilaCentro"><Data ss:Type="String">${escaparXml(m.fecha)}</Data></Cell>
    <Cell ss:StyleID="FilaCentro"><Data ss:Type="String">${escaparXml(hora)}</Data></Cell>
    <Cell ss:StyleID="FilaCentro"><Data ss:Type="String">${escaparXml(m.numeroReferencia || "—")}</Data></Cell>
    <Cell ss:StyleID="FilaCentro"><Data ss:Type="String">${escaparXml(m.codigo)}</Data></Cell>
    <Cell ss:StyleID="FilaNormal"><Data ss:Type="String">${escaparXml(m.nombre)}</Data></Cell>
    <Cell ss:StyleID="FilaCentro"><Data ss:Type="String">${escaparXml(m.unidadMedida)}</Data></Cell>
    <Cell ss:StyleID="FilaCentro"><Data ss:Type="String">${escaparXml(m.origen)}</Data></Cell>
    <Cell ss:StyleID="FilaCentro"><Data ss:Type="String">${escaparXml(m.tipo)}</Data></Cell>
    <Cell ss:StyleID="${m.entradas ? "FilaEntrada" : "FilaNumero"}"><Data ss:Type="Number">${m.entradas || 0}</Data></Cell>
    <Cell ss:StyleID="${m.salidas ? "FilaSalida" : "FilaNumero"}"><Data ss:Type="Number">${m.salidas || 0}</Data></Cell>
    <Cell ss:StyleID="FilaSaldo"><Data ss:Type="Number">${m.stockSaldo}</Data></Cell>
    <Cell ss:StyleID="FilaNormal"><Data ss:Type="String">${escaparXml(destino || "—")}</Data></Cell>
    <Cell ss:StyleID="FilaNormal"><Data ss:Type="String">${escaparXml(m.concepto)}</Data></Cell>
    <Cell ss:StyleID="FilaNormal"><Data ss:Type="String">${escaparXml(m.usuario)}</Data></Cell>
   </Row>`;
     })
     .join("")}

   <!-- FILA DE TOTALES -->
   <Row ss:Height="22">
    <Cell ss:MergeAcross="7" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTALES / BALANCE DEL PERÍODO:</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${totalEntradas.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${totalSalidas.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalNum"><Data ss:Type="Number">${saldoFinal.toFixed(2)}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="TotalLabel"><Data ss:Type="String">${movimientos.length} movimientos</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="Kardex_Inventario_Emmanuel_${hoyIso}.xls"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
