import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioPersona } from "@/components/forms/Persona";

export const metadata = { title: "Nuevo proveedor" };

export default function NuevoProveedor() {
  return (
    <PageDocument seccion="Proveedores" titulo="Nuevo proveedor" volverUrl="/proveedores">
      <FormularioPersona tipo="proveedor" />
    </PageDocument>
  );
}
