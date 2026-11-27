import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioPersona } from "@/components/forms/Persona";

export const metadata = { title: "Nuevo cliente" };

export default function NuevoCliente() {
  return (
    <PageDocument seccion="Clientes" titulo="Nuevo cliente" volverUrl="/clientes">
      <FormularioPersona tipo="cliente" />
    </PageDocument>
  );
}
