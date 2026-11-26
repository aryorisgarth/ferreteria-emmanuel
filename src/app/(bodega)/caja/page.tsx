import { Aviso } from "@/components/documentos/Pieza";
import { Caja } from "@/components/forms/Caja";
import { hoyISO } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Caja y Punto de Venta" };

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    aviso?: string;
    ticket?: string;
    vuelto?: string;
    recibido?: string;
  }>;
}) {
  const sp = await searchParams;
  const [catalogo, clientes, turno, config, cotizacionesData] = await Promise.all([
    api.catalogo(),
    api.clientes(),
    api.turnoActivo(),
    obtenerConfiguracion(),
    api.cotizaciones(1, "", "").catch(() => ({ rows: [] })),
  ]);

  let ticketExitoso = null;
  if (sp.ticket) {
    const detalle = await api.factura(sp.ticket);
    if (detalle) {
      ticketExitoso = {
        ...detalle,
        vuelto: sp.vuelto ? Number(sp.vuelto) : 0,
        recibido: sp.recibido ? Number(sp.recibido) : 0,
      };
    }
  }

  const cotizacionesLista =
    (cotizacionesData as any)?.rows || (cotizacionesData as any)?.items || [];

  return (
    <div className="w-full px-2 py-1 sm:px-3 sm:py-2 max-w-[1920px] mx-auto print:p-0">
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}
      <Caja
        catalogo={catalogo}
        clientes={clientes}
        fecha={hoyISO()}
        turno={turno}
        config={config}
        ticketExitoso={ticketExitoso}
        cotizaciones={cotizacionesLista}
      />
    </div>
  );
}
