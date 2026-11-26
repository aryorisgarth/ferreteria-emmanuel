import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageDocument } from "@/components/documentos/Pieza";
import { FormularioPedidoCompraDocumento } from "@/components/forms/compra/FormularioPedidoCompraDocumento";
import { hoyISO } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Nuevo Pedido de Compra" };

export default async function NuevoPedidoPage({
  searchParams,
}: {
  searchParams?: Promise<{ sugerido?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const [catalogo, proveedores, config] = await Promise.all([
    api.catalogo(),
    api.proveedores(),
    obtenerConfiguracion(),
  ]);

  const filasIniciales = sp.sugerido === "1"
    ? catalogo
        .filter((p) => p.stockActual <= p.stockMinimo)
        .map((p) => ({
          productoId: p.id,
          cantidad: Math.max(1, p.stockMinimo * 2 - p.stockActual),
          costo: p.precio,
          observacion: `Reabastecimiento sugerido (Stock: ${p.stockActual}, Mín: ${p.stockMinimo})`,
        }))
    : [];

  return (
    <PageDocument
      seccion="Entradas y Abastecimiento"
      titulo="Emitir Orden / Pedido de Compra"
      anchoCompleto={true}
      acciones={
        <Link className="btn btn-linea h-10 px-3 text-xs font-bold gap-1.5" href="/compras/pedidos">
          <ArrowLeft size={15} />
          Volver a Pedidos
        </Link>
      }
    >
      {catalogo.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-slate-600">Primero debe registrar artículos en el inventario.</p>
          <Link className="btn btn-navy mt-4" href="/inventario/nuevo">
            Ir al Inventario
          </Link>
        </div>
      ) : (
        <FormularioPedidoCompraDocumento
          catalogo={catalogo}
          proveedores={proveedores}
          fecha={hoyISO()}
          simboloMoneda={config.moneda.simbolo}
          filasIniciales={filasIniciales}
        />
      )}
    </PageDocument>
  );
}
