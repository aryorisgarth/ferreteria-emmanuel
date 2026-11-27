import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioArticulo } from "@/components/forms/Articulo";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Nuevo artículo" };

export default async function NuevoArticulo({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const categorias = await api.categorias();
  return (
    <PageDocument seccion="Inventario" titulo="Nuevo artículo" volverUrl="/inventario">
      <FormularioArticulo categorias={categorias} error={sp.error} />
    </PageDocument>
  );
}
