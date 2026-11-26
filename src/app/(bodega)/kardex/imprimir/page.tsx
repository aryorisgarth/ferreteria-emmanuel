import { AutoImprimir } from "@/components/documentos/AutoImprimir";
import { HojaKardexImpresion } from "@/components/kardex/HojaKardexImpresion";
import * as api from "@/lib/inventory/api";
import type { OrigenMovimiento, TipoMovimiento } from "@/lib/types";

export const metadata = { title: "Kárdex de Inventario Oficial para Imprimir" };

export default async function KardexImprimirPage({
  searchParams,
}: {
  searchParams: Promise<{
    producto?: string;
    codigo?: string;
    codigoBarras?: string;
    desde?: string;
    hasta?: string;
    tipo?: string;
    origen?: string;
    referencia?: string;
    busqueda?: string;
    auditoria?: string;
  }>;
}) {
  const sp = await searchParams;

  const [hoja, productoSel] = await Promise.all([
    api.kardex({
      productoId: sp.producto,
      codigo: sp.codigo,
      codigoBarras: sp.codigoBarras,
      desde: sp.desde,
      hasta: sp.hasta,
      tipo: (sp.tipo || undefined) as TipoMovimiento | undefined,
      origen: (sp.origen || undefined) as OrigenMovimiento | undefined,
      referencia: sp.referencia,
      busqueda: sp.busqueda,
      soloAuditoria: sp.auditoria === "1",
      page: "todas",
    }),
    sp.producto ? api.producto(sp.producto) : Promise.resolve(null),
  ]);

  const retorno = new URLSearchParams();
  if (sp.producto) retorno.set("producto", sp.producto);
  if (sp.codigo) retorno.set("codigo", sp.codigo);
  if (sp.codigoBarras) retorno.set("codigoBarras", sp.codigoBarras);
  if (sp.desde) retorno.set("desde", sp.desde);
  if (sp.hasta) retorno.set("hasta", sp.hasta);
  if (sp.tipo) retorno.set("tipo", sp.tipo);
  if (sp.origen) retorno.set("origen", sp.origen);
  if (sp.referencia) retorno.set("referencia", sp.referencia);
  if (sp.busqueda) retorno.set("busqueda", sp.busqueda);
  if (sp.auditoria) retorno.set("auditoria", sp.auditoria);

  return (
    <>
      <AutoImprimir />
      <HojaKardexImpresion
        movimientos={hoja.rows}
        productoSel={productoSel}
        criterios={{
          desde: sp.desde,
          hasta: sp.hasta,
          tipo: sp.tipo,
          origen: sp.origen,
          referencia: sp.referencia,
          auditoria: sp.auditoria,
        }}
        retornoQuery={retorno.toString()}
      />
    </>
  );
}
