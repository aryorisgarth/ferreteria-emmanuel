import Link from "next/link";
import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioCotizacionDocumento } from "@/components/forms/cotizacion/FormularioCotizacionDocumento";
import { hoyISO } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Nueva Cotización" };

export default async function NuevaCotizacion() {
  const [catalogo, clientes, config] = await Promise.all([
    api.catalogo(),
    api.clientes(),
    obtenerConfiguracion(),
  ]);

  return (
    <PageDocument seccion="Ventas" titulo="Nueva Cotización" anchoCompleto={true}>
      {catalogo.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-slate-600">Primero da de alta un artículo en el inventario.</p>
          <Link className="btn btn-navy mt-4" href="/inventario/nuevo">
            Ir al inventario
          </Link>
        </div>
      ) : (
        <FormularioCotizacionDocumento
          catalogo={catalogo}
          clientes={clientes}
          fecha={hoyISO()}
          modo="cotizacion"
          simboloMoneda={config.moneda.simbolo}
          porcentajeImpuesto={config.impuesto.porcentaje}
        />
      )}
    </PageDocument>
  );
}
