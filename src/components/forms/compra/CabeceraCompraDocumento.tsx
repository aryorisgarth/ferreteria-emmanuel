"use client";

import { UserPlus } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import type { Proveedor, RecepcionCompra } from "@/lib/types";

interface CabeceraCompraDocumentoProps {
  fecha: string;
  proveedorNombre: string;
  setProveedorNombre: (val: string) => void;
  listaProveedores: Proveedor[];
  setProveedorId: (id: string) => void;
  setModalProveedor: (open: boolean) => void;
  condicionPago: "CONTADO" | "CREDITO";
  setCondicionPago: (c: "CONTADO" | "CREDITO") => void;
  recepcionesPendientes: RecepcionCompra[];
  recepcionId: string;
  setRecepcionId: (id: string) => void;
}

export function CabeceraCompraDocumento({
  fecha,
  proveedorNombre,
  setProveedorNombre,
  listaProveedores,
  setProveedorId,
  setModalProveedor,
  condicionPago,
  setCondicionPago,
  recepcionesPendientes,
  recepcionId,
  setRecepcionId,
}: CabeceraCompraDocumentoProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
        <Logo variante="color" className="h-8 sm:h-9 w-auto shrink-0" />
        <h1 className="text-sm sm:text-base font-bold text-[#1e40af] tracking-wide uppercase text-center flex-1">
          Factura de Compra y Entrada de Materiales
        </h1>
        <div className="font-mono text-xs font-bold text-slate-900 whitespace-nowrap">FECHA: {fecha}</div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <span className="font-bold text-slate-900 whitespace-nowrap">Proveedor / Distribuidora:</span>
          <div className="flex-1 flex items-center gap-2 border-b border-slate-300 pb-0.5">
            <input
              name="proveedor"
              list="prov-doc"
              required
              value={proveedorNombre}
              onChange={(e) => {
                setProveedorNombre(e.target.value);
                const h = listaProveedores.find((p) => p.nombre.toLowerCase() === e.target.value.toLowerCase());
                setProveedorId(h?.id ?? "");
              }}
              placeholder="Nombre de la distribuidora o fabricante..."
              className="w-full bg-transparent text-xs font-bold uppercase text-slate-900 outline-none"
            />
            <button
              type="button"
              onClick={() => setModalProveedor(true)}
              className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <UserPlus size={12} /> + Nuevo
            </button>
          </div>
          <datalist id="prov-doc">
            {listaProveedores.map((p) => (
              <option key={p.id} value={p.nombre} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-300 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 whitespace-nowrap">No. Factura:</span>
            <input
              name="facturaProveedor"
              placeholder="Ej. FAC-0012948"
              className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 whitespace-nowrap">Condición:</span>
            <select
              name="condicionPago"
              value={condicionPago}
              onChange={(e) => setCondicionPago(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none"
            >
              <option value="CONTADO">Contado (Inmediato)</option>
              <option value="CREDITO">Crédito (30 días)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 whitespace-nowrap">
              {condicionPago === "CONTADO" ? "Pago:" : "Plazo:"}
            </span>
            {condicionPago === "CONTADO" ? (
              <select name="formaPago" className="bg-transparent text-xs font-bold text-slate-800 outline-none">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            ) : (
              <input
                type="number"
                name="diasCredito"
                defaultValue={30}
                className="w-16 border border-slate-300 rounded px-1 text-center font-mono font-bold text-xs"
              />
            )}
          </div>
        </div>

        {recepcionesPendientes.length > 0 && (
          <div className="flex items-center gap-2 border-b border-slate-300 pb-1.5">
            <span className="font-bold text-slate-700 whitespace-nowrap">Vincular Recepción:</span>
            <select
              value={recepcionId}
              onChange={(e) => setRecepcionId(e.target.value)}
              className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none"
            >
              <option value="">— Entrada directa (ingreso inmediato al kárdex) —</option>
              {recepcionesPendientes.map((r) => (
                <option key={r.id} value={r.id}>
                  Recepción #{r.numero} ({r.fecha})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </>
  );
}
