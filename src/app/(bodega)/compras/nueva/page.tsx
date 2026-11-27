import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioCompraDocumento } from "@/components/forms/compra/FormularioCompraDocumento";
import { hoyISO } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Registrar Compra / Factura de Proveedor" };

export default async function NuevaCompra({
  searchParams,
}: {
  searchParams: Promise<{ recepcionId?: string }>;
}) {
  const sp = await searchParams;
  const recepcionId = sp.recepcionId || "";

  const [catalogo, proveedores, listaRecepciones, listaCompras, config] = await Promise.all([
    api.catalogo(),
    api.proveedores(),
    api.recepciones(),
    api.compras(1),
    obtenerConfiguracion(),
  ]);

  const recepcionesConCompra = new Set(
    (listaCompras.rows || []).map((c) => c.compra.recepcionId).filter(Boolean)
  );

  const recepcionesSinFactura = (listaRecepciones.rows || []).filter(
    (r) => !recepcionesConCompra.has(r.id)
  );

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo="Registrar Factura de Compra"
      anchoCompleto={true}
      volverUrl="/compras"
    >
      {catalogo.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-slate-600">Primero debe registrar artículos en el catálogo de inventario.</p>
          <Link className="btn btn-navy mt-4" href="/inventario/nuevo">
            Ir al Inventario
          </Link>
        </div>
      ) : (
        <FormularioCompraDocumento
          catalogo={catalogo}
          proveedores={proveedores}
          fecha={hoyISO()}
          recepcionesPendientes={recepcionesSinFactura}
          recepcionInicialId={recepcionId}
          simboloMoneda={config.moneda.simbolo}
          porcentajeImpuesto={config.impuesto.porcentaje}
        />
      )}
    </PageDocument>
  );
}
