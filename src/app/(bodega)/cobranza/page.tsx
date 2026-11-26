import Link from "next/link";
import {
  Banknote,
  Receipt,
  Users,
  ShieldCheck,
  Building2,
  Filter,
  Search,
  Plus,
} from "lucide-react";
import { PageDocument, Aviso } from "@/components/documentos/Pieza";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";
import { obtenerSesionActual } from "@/lib/auth";
import { PanelTransferenciasBancarias } from "@/components/pagos/PanelTransferenciasBancarias";
import { CuentasPorCobrarModulo, type ItemCuentaPorCobrar } from "@/components/pagos/CuentasPorCobrarModulo";

export const metadata = { title: "Gestión de Pagos, Abonos y Transferencias" };

export default async function CobranzaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const tabActiva = sp.tab || "transferencias";

  const [hojaCartera, config, sesion, turno, transferencias] = await Promise.all([
    api.cuentasPorCobrar(0, sp.q || ""),
    obtenerConfiguracion(),
    obtenerSesionActual(),
    api.turnoActivo().catch(() => null),
    api.transferenciasPendientes().catch(() => []),
  ]);

  const simbolo = config.moneda.simbolo;
  const esPropietario = sesion?.rol === "ADMINISTRADOR";

  // Facturas a crédito con saldo pendiente consultadas directamente desde el origen
  const facturasCredito: ItemCuentaPorCobrar[] = (
    ((hojaCartera as any).rows || (hojaCartera as any).items || []) as any[]
  ).map((f: any) => ({
    id: f.id,
    numero: f.numero,
    cliente: f.cliente,
    clienteId: f.clienteId,
    fecha: f.fecha,
    total: f.total || 0,
    saldoPendiente: f.saldoPendiente !== undefined ? f.saldoPendiente : (f.total || 0),
    abonosPrevios: f.abonosPrevios || 0,
    formaPago: f.formaPago,
    estado: f.estado,
  }));

  return (
    <PageDocument
      seccion="Finanzas & Cartera"
      titulo="Gestión de Pagos, Abonos y Transferencias"
      acciones={
        <div className="flex items-center gap-2">
          <Link
            className="btn btn-linea h-10 px-4 text-xs font-bold gap-1.5"
            href="/facturas"
          >
            <Receipt size={15} />
            Ver Facturas
          </Link>
          <Link
            className="btn btn-amarillo h-10 px-4 text-xs font-bold gap-1.5 shadow-xs"
            href="/caja"
          >
            <Banknote size={15} />
            Ir a Caja (POS)
          </Link>
        </div>
      }
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}

      {/* Pestañas de Navegación de la Vista */}
      <div className="mb-6 flex border-b border-slate-200">
        <Link
          href="/cobranza?tab=transferencias"
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
            tabActiva === "transferencias"
              ? "border-amber-500 text-slate-900 bg-amber-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 size={16} className={tabActiva === "transferencias" ? "text-amber-500" : "text-slate-400"} />
          <span>Transferencias Bancarias</span>
        </Link>

        <Link
          href="/cobranza?tab=cuentas_cobrar"
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
            tabActiva === "cuentas_cobrar"
              ? "border-amber-500 text-slate-900 bg-amber-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} className={tabActiva === "cuentas_cobrar" ? "text-amber-500" : "text-slate-400"} />
          <span>Cuentas por Cobrar & Abonos a Crédito</span>
          {facturasCredito.length > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-black">
              {facturasCredito.length}
            </span>
          )}
        </Link>
      </div>

      {/* Contenido según la pestaña activa */}
      {tabActiva === "transferencias" ? (
        <PanelTransferenciasBancarias
          transferencias={transferencias || []}
          simboloMoneda={simbolo}
          esPropietario={esPropietario}
          usuarioActual={sesion}
        />
      ) : (
        <CuentasPorCobrarModulo
          facturasCredito={facturasCredito}
          simboloMoneda={simbolo}
          turnoActivo={turno}
          esPropietario={esPropietario}
          usuarioActual={sesion}
        />
      )}
    </PageDocument>
  );
}
