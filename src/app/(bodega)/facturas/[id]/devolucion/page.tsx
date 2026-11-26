import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioDevolucionCliente } from "@/components/forms/DevolucionCliente";
import { hoyISO } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Devolución de Cliente" };

export default async function DevolucionClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detalle, config, devolucionesPrevias] = await Promise.all([
    api.factura(id),
    obtenerConfiguracion(),
    api.devolucionesCliente({ facturaId: id }),
  ]);

  if (!detalle) notFound();

  const { factura, items } = detalle;

  // Enriquecer items con nombres de producto para la vista
  const itemsEnriquecidos = factura.items.map((it) => {
    const itemDet = items.find((d) => d.id === it.id);
    return {
      ...it,
      nombre: itemDet?.nombre || it.productoId,
    };
  });

  return (
    <PageDocument
      seccion="Facturación y Ventas"
      titulo={`Devolución · Factura ${factura.numero}`}
      acciones={
        <Link className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5" href={`/facturas/${factura.id}`}>
          <ArrowLeft size={15} />
          Volver a la Factura
        </Link>
      }
    >
      <FormularioDevolucionCliente
        factura={{ ...factura, items: itemsEnriquecidos }}
        devolucionesPrevias={devolucionesPrevias}
        simbolo={config.moneda.simbolo}
        fecha={hoyISO()}
      />
    </PageDocument>
  );
}
