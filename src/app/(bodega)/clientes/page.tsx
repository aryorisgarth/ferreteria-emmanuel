import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { ClientesCrud } from "@/components/crud/ClientesCrud";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Clientes" };

export default async function Clientes({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; error?: string; page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const q = sp.q || "";

  const hoja = await api.clientesPaginados(page, q, 24);

  return (
    <PageDocument seccion="Ventas" titulo="Directorio de Clientes">
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}
      <ClientesCrud
        clientesIniciales={hoja.rows}
        totalServidor={hoja.total}
        totalPaginasServidor={hoja.pages}
        paginaServidor={hoja.page}
        qServidor={q}
      />
    </PageDocument>
  );
}
