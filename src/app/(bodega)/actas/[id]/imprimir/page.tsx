import { notFound } from "next/navigation";
import { AutoImprimir } from "@/components/documentos/AutoImprimir";
import { DocumentoActaEntrega } from "@/components/actas/DocumentoActaEntrega";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Imprimir Acta de Entrega" };

export default async function ImprimirActaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const acta = await api.acta(id);
  if (!acta) notFound();

  return (
    <div className="p-4 sm:p-8 bg-white min-h-screen">
      <AutoImprimir />
      <DocumentoActaEntrega acta={acta} />
    </div>
  );
}
