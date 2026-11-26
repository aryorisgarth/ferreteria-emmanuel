"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Receipt,
  Search,
  Filter,
  DollarSign,
  Plus,
  AlertCircle,
  ExternalLink,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { dinero, fechaCorta, numero } from "@/lib/format";
import type { TurnoCaja } from "@/lib/types";
import { ModalRegistrarAbono, type FacturaParaAbono } from "./ModalRegistrarAbono";

export interface ItemCuentaPorCobrar {
  id: string;
  numero: string;
  cliente: string;
  clienteId?: string | null;
  fecha: string;
  total: number;
  saldoPendiente: number;
  abonosPrevios?: number;
  diasCredito?: number;
  formaPago: string;
  estado: string;
}

interface CuentasPorCobrarModuloProps {
  facturasCredito: ItemCuentaPorCobrar[];
  simboloMoneda?: string;
  turnoActivo: TurnoCaja | null;
  esPropietario: boolean;
  usuarioActual?: {
    usuario: string;
    nombre: string;
    rol: string;
  } | null;
}

export function CuentasPorCobrarModulo({
  facturasCredito = [],
  simboloMoneda = "C$",
  turnoActivo,
  esPropietario,
  usuarioActual,
}: CuentasPorCobrarModuloProps) {
  const [q, setQ] = useState("");
  const [facturaSeleccionadaAbono, setFacturaSeleccionadaAbono] = useState<FacturaParaAbono | null>(null);
  const [modalAbonoAbierto, setModalAbonoAbierto] = useState(false);

  // Filtrado
  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return facturasCredito.filter((f) => {
      return (
        !t ||
        f.numero.toLowerCase().includes(t) ||
        f.cliente.toLowerCase().includes(t)
      );
    });
  }, [facturasCredito, q]);

  // Métricas
  const totalCarteraPendiente = useMemo(() => {
    return facturasCredito.reduce((s, f) => s + (f.saldoPendiente || f.total || 0), 0);
  }, [facturasCredito]);

  const clientesDeudoresUnicos = useMemo(() => {
    const set = new Set<string>();
    facturasCredito.forEach((f) => {
      if (f.cliente) set.add(f.cliente.toLowerCase());
    });
    return set.size;
  }, [facturasCredito]);

  function abrirAbono(f: ItemCuentaPorCobrar) {
    setFacturaSeleccionadaAbono({
      id: f.id,
      numero: f.numero,
      cliente: f.cliente,
      clienteId: f.clienteId,
      total: f.total,
      saldoPendiente: f.saldoPendiente !== undefined ? f.saldoPendiente : f.total,
      abonosPrevios: f.abonosPrevios || 0,
      fecha: f.fecha,
    });
    setModalAbonoAbierto(true);
  }

  return (
    <div className="space-y-4">
      {/* 1. Métricas Rápidas de Cartera */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              Total Cartera por Cobrar
            </span>
            <DollarSign size={16} className="text-amber-600" />
          </div>
          <p className="mt-1 font-mono text-xl font-black text-amber-950">
            {dinero(totalCarteraPendiente, simboloMoneda)}
          </p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Saldo acumulado de facturas a crédito activas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Clientes con Crédito Activo
            </span>
            <Users size={16} className="text-slate-400" />
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-800">
            {clientesDeudoresUnicos}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cuentas con saldo pendiente de pago
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Facturas en Cartera
            </span>
            <Receipt size={16} className="text-slate-400" />
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-800">
            {facturasCredito.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Comprobantes pendientes de liquidación
          </p>
        </div>
      </div>

      {/* 2. Barra de Búsqueda */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente o folio de factura (FAC-...)..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs font-medium text-slate-800 outline-none transition focus:border-brand-yellow focus:bg-white"
          />
        </div>
      </div>

      {/* 3. Listado de Facturas con Deuda y Botón de Abono */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt size={17} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Facturas a Crédito con Saldo Pendiente
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filtradas.length} comprobante{filtradas.length === 1 ? "" : "s"}
          </span>
        </div>

        {filtradas.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">No hay facturas con deuda pendiente</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Todas las ventas a crédito han sido canceladas o no coinciden con los criterios de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Folio / Fecha</th>
                  <th className="py-2.5 px-3">Cliente Deudor</th>
                  <th className="py-2.5 px-3 text-right">Total Factura</th>
                  <th className="py-2.5 px-3 text-right">Abonos Recibidos</th>
                  <th className="py-2.5 px-3 text-right">Saldo Pendiente</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtradas.map((f) => {
                  const saldoP = f.saldoPendiente !== undefined ? f.saldoPendiente : f.total;
                  const abonos = f.abonosPrevios || Math.max(0, f.total - saldoP);

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono">
                        <Link href={`/facturas/${f.id}`} className="font-bold text-blue-600 hover:underline">
                          {f.numero}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-sans">{fechaCorta(f.fecha)}</p>
                      </td>

                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-800">{f.cliente}</p>
                        {f.clienteId && (
                          <Link href={`/clientes/${f.clienteId}`} className="text-[10px] text-slate-400 hover:underline">
                            Ver estado de cuenta
                          </Link>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                        {dinero(f.total, simboloMoneda)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                        {dinero(abonos, simboloMoneda)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-black text-amber-700 text-sm">
                        {dinero(saldoP, simboloMoneda)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          Crédito Activo
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => abrirAbono(f)}
                          className="btn btn-amarillo h-7 px-3 text-[11px] font-bold gap-1 shadow-2xs"
                        >
                          <Plus size={12} />
                          <span>Abonar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Abono */}
      <ModalRegistrarAbono
        abierto={modalAbonoAbierto}
        alCerrar={() => setModalAbonoAbierto(false)}
        factura={facturaSeleccionadaAbono}
        simboloMoneda={simboloMoneda}
        turnoActivo={turnoActivo}
        esPropietario={esPropietario}
        usuarioActual={usuarioActual}
      />
    </div>
  );
}
