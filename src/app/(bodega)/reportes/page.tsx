import { PageDocument } from "@/components/documentos/Pieza";
import { CentroReportes } from "@/components/reportes/CentroReportes";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Centro de Reportes y Documentos" };

export default async function ReportesPage() {
  const [
    productos,
    categorias,
    marcas,
    config,
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
  ] = await Promise.all([
    api.catalogo(),
    api.categorias().catch(() => [
      "Ferretería General",
      "Herramientas",
      "Fontanería",
      "Material Eléctrico",
      "Pinturas y Adhesivos",
      "Construcción",
      "Tornillería y Fijaciones",
    ]),
    api.marcas().catch(() => [
      "Truper",
      "Pretul",
      "Stanley",
      "DeWalt",
      "Makita",
      "Amanco",
      "Holcim",
      "Cemento Canal",
      "Corona",
      "Sika",
      "Genérica",
    ]),
    obtenerConfiguracion(),
    api.reporteVentasPeriodo(),
    api.reporteVentasProducto(),
    api.reporteVentasCajero(),
    api.reporteVentasMedioPago(),
    api.reporteComprasProveedor(),
    api.reporteDevoluciones(),
    api.reporteCuentasPorPagar(),
    api.reporteCuentasPorCobrar(),
    api.reporteCajaTurnos(),
    api.reporteAuditoria(),
  ]);

  return (
    <PageDocument
      seccion="Inteligencia & Auditoría"
      titulo="Centro de Reportes y Documentos Oficiales"
      anchoCompleto={true}
    >
      <CentroReportes
        productos={productos}
        categoriasDisponibles={categorias}
        marcasDisponibles={marcas}
        simbolo={config.moneda.simbolo}
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
        empresaConfig={config.empresa}
      />
    </PageDocument>
  );
}
