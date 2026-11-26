import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { BotonImprimir } from "@/components/documentos/Imprimir";
import { Logo, MarcaAguaImpresion } from "@/components/marca/Logo";
import { TablaKardex } from "@/components/documentos/TablaKardex";
import { fechaLarga, numero } from "@/lib/format";
import type { MovimientoVista, ProductoVista } from "@/lib/types";

interface HojaKardexImpresionProps {
  movimientos: MovimientoVista[];
  productoSel: ProductoVista | null;
  criterios: {
    desde?: string;
    hasta?: string;
    tipo?: string;
    origen?: string;
    referencia?: string;
    auditoria?: string;
  };
  retornoQuery: string;
}

export function HojaKardexImpresion({
  movimientos,
  productoSel,
  criterios,
  retornoQuery,
}: HojaKardexImpresionProps) {
  const hoyIso = new Date().toISOString().slice(0, 10);
  const horaActual = new Date().toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" });
  const totalEntradas = movimientos.reduce((acc, m) => acc + (m.entradas || 0), 0);
  const totalSalidas = movimientos.reduce((acc, m) => acc + (m.salidas || 0), 0);
  const saldoFinal = movimientos.length > 0 ? movimientos[movimientos.length - 1].stockSaldo : 0;

  return (
    <article className="hoja-kardex relative mx-auto max-w-[11in] bg-white px-6 py-6 overflow-hidden print:overflow-visible print:px-2 print:py-2">
      <MarcaAguaImpresion orientacion="horizontal" />
      <div className="relative z-10 space-y-4">
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-3">
          <Link className="btn btn-linea h-9 px-3.5 text-xs font-bold gap-1.5" href={`/kardex?${retornoQuery}`}>
            <ArrowLeft size={14} /> Volver al Kárdex
          </Link>
          <BotonImprimir><Printer size={15} /> Imprimir Kárdex Oficial</BotonImprimir>
        </div>
        <header className="border-b-2 border-slate-900 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Logo variante="color" compacto />
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#dc2626]">
                FERRETERÍA EMMANUEL · CONTROL Y AUDITORÍA DE INVENTARIOS
              </div>
              <p className="text-[10px] text-slate-500 font-mono">RUC: J0310000000000 · Managua, Nicaragua</p>
            </div>
            <div className="text-right">
              <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#1e40af]">Libro Kárdex de Movimientos</h1>
              <p className="text-[10px] text-slate-500 mt-0.5">Emisión: <strong>{fechaLarga(hoyIso)} · {horaActual}</strong></p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded bg-slate-50 p-2.5 text-xs border border-slate-200 font-mono">
            <div>
              <span className="block text-[9.5px] font-bold text-slate-500 uppercase font-sans">Artículo</span>
              <span className="font-bold text-slate-900 truncate block">
                {productoSel ? `${productoSel.codigo} - ${productoSel.nombre}` : "Todos los artículos"}
              </span>
            </div>
            <div>
              <span className="block text-[9.5px] font-bold text-slate-500 uppercase font-sans">Período</span>
              <span className="font-bold text-slate-800">
                {criterios.desde || criterios.hasta ? `Del ${criterios.desde || "Inicio"} al ${criterios.hasta || "Hoy"}` : "Histórico Completo"}
              </span>
            </div>
            <div>
              <span className="block text-[9.5px] font-bold text-slate-500 uppercase font-sans">Filtros Activos</span>
              <span className="text-slate-700">
                {[criterios.tipo ? `Tipo: ${criterios.tipo}` : null, criterios.origen ? `Origen: ${criterios.origen}` : null, criterios.referencia ? `Ref: ${criterios.referencia}` : null, criterios.auditoria === "1" ? "Auditoría" : null].filter(Boolean).join(" · ") || "General"}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[9.5px] font-bold text-slate-500 uppercase font-sans">Renglones</span>
              <span className="font-bold text-slate-900">{movimientos.length} registrados</span>
            </div>
          </div>
        </header>
        <TablaKardex filas={movimientos} />
        <div className="rounded border border-slate-300 bg-slate-50 p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500 font-sans">Movimientos</span>
              <span className="font-extrabold text-sm text-slate-900">{movimientos.length}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500 font-sans">Entradas Totales</span>
              <span className="font-extrabold text-sm text-emerald-700">+{numero(totalEntradas)}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500 font-sans">Salidas Totales</span>
              <span className="font-extrabold text-sm text-rose-700">-{numero(totalSalidas)}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase text-slate-500 font-sans">Saldo Final</span>
              <span className="font-extrabold text-base text-slate-900">{numero(saldoFinal)} {productoSel ? productoSel.unidadMedida : ""}</span>
            </div>
          </div>
        </div>
        <div className="hidden print:grid grid-cols-2 gap-8 pt-8 pb-4 text-center text-xs">
          <div>
            <div className="border-t border-slate-800 w-52 mx-auto pt-1 font-bold">Bodeguero Responsable</div>
            <div className="text-[10px] text-slate-500">Custodia y Movimientos de Almacén</div>
          </div>
          <div>
            <div className="border-t border-slate-800 w-52 mx-auto pt-1 font-bold">Auditor / Contador</div>
            <div className="text-[10px] text-slate-500">Verificación Físico-Contable</div>
          </div>
        </div>
      </div>
    </article>
  );
}
