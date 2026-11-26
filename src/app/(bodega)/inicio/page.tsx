import Link from "next/link";
import { AlertTriangle, Package, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { TarjetasKpiInicio } from "@/components/inicio/TarjetasKpiInicio";
import { PanelFinancieroInicio } from "@/components/inicio/PanelFinancieroInicio";
import { CarteraCreditosInicio } from "@/components/inicio/CarteraCreditosInicio";
import { SeccionOperativaInicio } from "@/components/inicio/SeccionOperativaInicio";
import { dinero, fechaLarga } from "@/lib/format";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Panel de Control Diario" };

export default async function Inicio({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; error?: string; fecha?: string }>;
}) {
  const sp = await searchParams;
  const fechaFiltro = sp.fecha || new Date().toISOString().slice(0, 10);
  const resumen = await api.resumen(fechaFiltro);

  const tarjetas = [
    {
      href: "/caja",
      label: "Ventas del Día",
      valor: dinero(resumen.ventas),
      detalle: `Facturado el ${fechaLarga(resumen.fecha)}`,
      icono: ShoppingCart,
      badgeClase: "text-slate-900 bg-slate-100 border border-slate-200",
    },
    {
      href: "/reportes",
      label: "Ventas del Mes",
      valor: dinero((resumen as any).ventasMes ?? resumen.ventas),
      detalle: `Mes ${fechaFiltro.slice(0, 7)} acumulado`,
      icono: TrendingUp,
      badgeClase: "text-blue-700 bg-blue-50 border border-blue-200",
    },
    {
      href: "/inventario",
      label: "Valor de Inventario",
      valor: dinero((resumen as any).valorInventario ?? 0),
      detalle: "Al costo promedio ponderado",
      icono: Package,
      badgeClase: "text-emerald-700 bg-emerald-50 border border-emerald-200",
    },
    {
      href: "/inventario",
      label: "Stock en Mínimo",
      valor: String(resumen.stockBajo.length),
      detalle: "Artículos en umbral crítico",
      icono: AlertTriangle,
      badgeClase: "text-rose-700 bg-rose-50 border border-rose-200",
    },
  ];

  return (
    <PageDocument
      seccion="Panel de Control"
      titulo="Resumen Operativo Diario"
      acciones={
        <Link
          className="btn btn-linea h-8 px-3 text-xs font-semibold gap-1.5"
          href="/total-del-dia"
        >
          <Receipt size={14} />
          <span>Arqueo de Caja</span>
        </Link>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      <div className="flex items-center justify-between pb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
          {fechaLarga(resumen.fecha)}
        </p>
      </div>

      <TarjetasKpiInicio tarjetas={tarjetas} />
      <PanelFinancieroInicio resumen={resumen} />
      <CarteraCreditosInicio
        porCobrar={(resumen as any).cuentasPorCobrar ?? resumen.porCobrar}
        porPagar={(resumen as any).cuentasPorPagar ?? 0}
      />
      <SeccionOperativaInicio stockBajo={resumen.stockBajo} />
    </PageDocument>
  );
}
