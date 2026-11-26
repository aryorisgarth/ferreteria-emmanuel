import { FormularioSolicitudDocumento } from "@/components/forms/solicitud/FormularioSolicitudDocumento";
import { PageDocument } from "@/components/documentos/Pieza";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Nueva solicitud de materiales" };

export default async function NuevaSolicitud() {
  const [catalogo, oficinas, fecha] = await Promise.all([
    api.catalogo(),
    api.oficinas(),
    api.fecha(),
  ]);

  return (
    <PageDocument
      seccion="Formulario de pedido"
      titulo="Nueva Solicitud y Entrega de Materiales"
      anchoCompleto={true}
      folio="SM"
    >
      <FormularioSolicitudDocumento catalogo={catalogo} oficinas={oficinas} fecha={fecha} />
    </PageDocument>
  );
}
