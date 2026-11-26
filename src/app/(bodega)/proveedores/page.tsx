import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { ProveedoresCrud } from "@/components/crud/ProveedoresCrud";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Proveedores" };

export default async function Proveedores({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const filas = await api.proveedores();

  return (
    <PageDocument seccion="Compras" titulo="Directorio de Proveedores">
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}
      <ProveedoresCrud proveedoresIniciales={filas} />
    </PageDocument>
  );
}
