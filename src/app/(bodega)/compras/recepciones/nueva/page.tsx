import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioRecepcionCompraDocumento } from "@/components/forms/compra/FormularioRecepcionCompraDocumento";
import { hoyISO } from "@/lib/format";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Nueva Recepción de Mercancía" };

export default async function NuevaRecepcionPage({
  searchParams,
}: {
  searchParams: Promise<{ pedidoId?: string }>;
}) {
  const sp = await searchParams;
  const pedidoId = sp.pedidoId || "";

  const [catalogo, proveedores, listaPedidos, pedidoDetalle] = await Promise.all([
    api.catalogo(),
    api.proveedores(),
    api.pedidos(),
    pedidoId ? api.pedido(pedidoId) : Promise.resolve(null),
  ]);

  const pedidosPendientes = (listaPedidos.rows || []).filter(
    (p) => p.estado === "EMITIDO" || p.estado === "PARCIAL"
  );

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo="Recepción Física de Mercancía"
      anchoCompleto={true}
      volverUrl="/compras/recepciones"
    >
      {catalogo.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-slate-600">Primero debe registrar artículos en el inventario.</p>
          <Link className="btn btn-navy mt-4" href="/inventario/nuevo">
            Ir al Inventario
          </Link>
        </div>
      ) : (
        <FormularioRecepcionCompraDocumento
          catalogo={catalogo}
          proveedores={proveedores}
          pedidosPendientes={pedidosPendientes}
          pedidoInicial={pedidoDetalle?.pedido || null}
          fecha={hoyISO()}
        />
      )}
    </PageDocument>
  );
}
