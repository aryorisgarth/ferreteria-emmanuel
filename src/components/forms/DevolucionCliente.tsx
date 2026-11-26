"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import Link from "next/link";
import { registrarDevolucionClienteAction } from "@/app/actions";
import { dinero, numero } from "@/lib/format";
import type { Factura, DevolucionCliente } from "@/lib/types";

export function FormularioDevolucionCliente({
  factura,
  devolucionesPrevias = [],
  simbolo = "C$",
  fecha,
}: {
  factura: Factura;
  devolucionesPrevias?: DevolucionCliente[];
  simbolo?: string;
  fecha: string;
}) {
  const [motivo, setMotivo] = useState("");
  const [metodoReintegro, setMetodoReintegro] = useState<"EFECTIVO" | "NOTA_CREDITO">("EFECTIVO");

  // Calcular devoluciones previas por producto
  const cantDevueltaPrevia = new Map<string, number>();
  for (const prev of devolucionesPrevias) {
    for (const it of prev.items) {
      cantDevueltaPrevia.set(it.productoId, (cantDevueltaPrevia.get(it.productoId) || 0) + it.cantidad);
    }
  }

  // Estado para la cantidad a devolver por línea
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  const itemsConSaldo = factura.items.map((it) => {
    const yaDevuelto = cantDevueltaPrevia.get(it.productoId) || 0;
    const disponible = Math.max(0, it.cantidad - yaDevuelto);
    return {
      ...it,
      yaDevuelto,
      disponible,
    };
  });

  const itemsADevolver = Object.entries(cantidades)
    .filter(([_, cant]) => cant > 0)
    .map(([productoId, cantidad]) => ({
      productoId,
      cantidad,
    }));

  const totalDevolver = itemsADevolver.reduce((sum, item) => {
    const itFac = factura.items.find((f) => f.productoId === item.productoId);
    return sum + (itFac ? itFac.precio * item.cantidad : 0);
  }, 0);

  return (
    <form action={registrarDevolucionClienteAction} className="space-y-6">
      <input type="hidden" name="facturaId" value={factura.id} />
      <input type="hidden" name="items" value={JSON.stringify(itemsADevolver)} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Registrar Devolución de Cliente</h3>
            <p className="text-xs text-slate-500">Factura {factura.numero} · Cliente: {factura.cliente}</p>
          </div>
          <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
            ✓ Reintegra stock físicamente a bodega y ajusta cobro
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Fecha de Devolución *
            </span>
            <input
              type="date"
              name="fecha"
              defaultValue={fecha}
              required
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
            />
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Método de Reintegro *
            </span>
            <select
              name="metodoReintegro"
              value={metodoReintegro}
              onChange={(e) => setMetodoReintegro(e.target.value as any)}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-semibold"
            >
              <option value="EFECTIVO">Efectivo (Egreso automático de Caja)</option>
              <option value="NOTA_CREDITO">Nota de Crédito / Saldo a Favor</option>
            </select>
          </div>
        </div>

        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Motivo de la Devolución *
          </span>
          <input
            name="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            placeholder="Ej. Medida incorrecta, cambio por otro material, sobrante de obra..."
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
          />
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="tabla w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="py-2.5 px-3">Artículo</th>
                <th className="py-2.5 px-3 text-center">Facturado</th>
                <th className="py-2.5 px-3 text-center">Ya Devuelto</th>
                <th className="py-2.5 px-3 text-center">Disponible</th>
                <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                <th className="py-2.5 px-3 text-center w-32">Cant. a Devolver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsConSaldo.map((it) => (
                <tr key={it.id}>
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {(it as any).nombre || it.productoId}
                    {it.observacion && <span className="block text-[11px] text-slate-400 font-normal">{it.observacion}</span>}
                  </td>
                  <td className="py-2 px-3 text-center font-mono">{numero(it.cantidad)}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{numero(it.yaDevuelto)}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">{numero(it.disponible)}</td>
                  <td className="py-2 px-3 text-right font-mono">{dinero(it.precio, simbolo)}</td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={it.disponible}
                      value={cantidades[it.productoId] ?? ""}
                      disabled={it.disponible <= 0}
                      placeholder="0"
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(it.disponible, Number(e.target.value) || 0));
                        setCantidades((prev) => ({ ...prev, [it.productoId]: val }));
                      }}
                      className="h-8 w-24 rounded border border-slate-300 text-center font-mono text-xs font-bold text-slate-800 outline-none focus:border-brand-yellow"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="text-xs text-slate-500">
            Total Reintegro Estimado: <span className="font-bold text-slate-900 font-mono text-sm">{dinero(totalDevolver, simbolo)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/facturas/${factura.id}`} className="btn btn-linea h-9 px-3 text-xs font-semibold">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={itemsADevolver.length === 0 || !motivo.trim()}
              className="btn btn-amarillo h-9 px-4 text-xs font-bold gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Undo2 size={14} />
              Procesar Devolución
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
