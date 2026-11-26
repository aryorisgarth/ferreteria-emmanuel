import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioDevolucionCompraDocumento } from "@/components/forms/compra/FormularioDevolucionCompraDocumento";
import { hoyISO } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Nueva Devolución a Proveedor" };

export default async function NuevaDevolucionPage({
  searchParams,
}: {
  searchParams: Promise<{ compraId?: string }>;
}) {
  const sp = await searchParams;
  const compraId = sp.compraId || "";

  const [listaCompras, config] = await Promise.all([
    api.compras(1),
    obtenerConfiguracion(),
  ]);

  const comprasActivas = (listaCompras.rows || []).filter((c) => !c.compra.anulada);

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo="Devolución de Mercancía a Proveedor"
      anchoCompleto={true}
      acciones={
        <Link className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5" href="/compras/devoluciones">
          <ArrowLeft size={15} />
          Volver a Devoluciones
        </Link>
      }
    >
      {comprasActivas.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-slate-600">No hay compras registradas para realizar devoluciones.</p>
          <Link className="btn btn-navy mt-4" href="/compras">
            Ir a Compras
          </Link>
        </div>
      ) : (
        <FormularioDevolucionCompraDocumento
          compras={comprasActivas}
          compraInicialId={compraId}
          simbolo={config.moneda.simbolo}
          fecha={hoyISO()}
        />
      )}
    </PageDocument>
  );
}
