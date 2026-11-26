import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioFacturaDocumento } from "@/components/forms/factura/FormularioFacturaDocumento";
import { hoyISO } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Nueva Factura" };

export default async function NuevaFactura() {
  const [catalogo, clientes, config] = await Promise.all([
    api.catalogo(),
    api.clientes(),
    obtenerConfiguracion(),
  ]);

  return (
    <PageDocument
      seccion="Ventas"
      titulo="Nueva Factura Directa"
      anchoCompleto={true}
      acciones={
        <Link className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5" href="/facturas">
          <ArrowLeft size={15} />
          Volver a Facturas
        </Link>
      }
    >
      {catalogo.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-slate-600">Primero da de alta un artículo con existencia en el inventario.</p>
          <Link className="btn btn-navy mt-4" href="/inventario/nuevo">
            Ir al inventario
          </Link>
        </div>
      ) : (
        <FormularioFacturaDocumento
          catalogo={catalogo}
          clientes={clientes}
          fecha={hoyISO()}
          modo="factura"
          simboloMoneda={config.moneda.simbolo}
          porcentajeImpuesto={config.impuesto.porcentaje}
        />
      )}
    </PageDocument>
  );
}
