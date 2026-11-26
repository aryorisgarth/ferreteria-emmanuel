"use client";

import { useActionState, useState } from "react";
import { Plus, PackageCheck, UserPlus, Truck } from "lucide-react";
import { crearRecepcionCompraAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import { CapturaVenta, type OpcionVenta } from "@/components/forms/Venta";
import type { PedidoCompra, Proveedor } from "@/lib/types";

const inicial: ResultadoAccion = null;

export function FormularioRecepcionCompra({
  catalogo,
  proveedores,
  pedidosPendientes = [],
  pedidoInicial = null,
  fecha,
}: {
  catalogo: OpcionVenta[];
  proveedores: Proveedor[];
  pedidosPendientes?: PedidoCompra[];
  pedidoInicial?: PedidoCompra | null;
  fecha: string;
}) {
  const [estado, accion, pendiente] = useActionState(crearRecepcionCompraAction, inicial);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState<string>(pedidoInicial?.id || "");
  const [proveedor, setProveedor] = useState<string>(pedidoInicial?.proveedor || "");

  const pedidoActual = pedidosPendientes.find((p) => p.id === pedidoSeleccionadoId) || (pedidoInicial?.id === pedidoSeleccionadoId ? pedidoInicial : null);

  const alCambiarPedido = (id: string) => {
    setPedidoSeleccionadoId(id);
    const p = pedidosPendientes.find((item) => item.id === id);
    if (p) {
      setProveedor(p.proveedor);
    }
  };

  return (
    <form action={accion} className="space-y-6">
      {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">Comprobante de Recepción Física de Mercancía</h3>
          <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
            ✓ Al registrar esta recepción, el inventario físico y Kárdex se incrementarán con su CPP correspondiente.
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {pedidosPendientes.length > 0 && (
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Vincular a Pedido / Orden Previa (Opcional)
              </span>
              <select
                name="pedidoId"
                value={pedidoSeleccionadoId}
                onChange={(e) => alCambiarPedido(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
              >
                <option value="">— Recepción sin pedido previo —</option>
                {pedidosPendientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero} · {p.proveedor} ({p.fechaEmision})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Proveedor / Distribuidora *
            </span>
            <input
              name="proveedor"
              required
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              list="proveedores-recep"
              placeholder="Nombre del proveedor"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
            />
            <datalist id="proveedores-recep">
              {proveedores.map((p) => (
                <option key={p.id} value={p.nombre} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Fecha de Entrada Física *
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
              No. Remisión / Guía de Entrega
            </span>
            <input
              name="remisionProveedor"
              placeholder="Ej. REM-99124"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
            />
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Estado de Conformidad
            </span>
            <select
              name="estadoConformidad"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
            >
              <option value="CONFORME">Conforme (Completo y en Buen Estado)</option>
              <option value="INCOMPLETO">Incompleto (Entrega Parcial)</option>
              <option value="CON_DANOS">Con Daños / Mercancía Observada</option>
            </select>
          </div>
        </div>

        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Notas de Inspección / Bodega
          </span>
          <input
            name="notas"
            placeholder="Ej. Bultos revisados, conteo verificado con el chofer del transporte..."
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">Artículos Físicamente Recibidos</h3>
          <p className="text-xs text-slate-500">
            Indique la cantidad real ingresada al almacén y el costo unitario acordado.
          </p>
        </div>
        <CapturaVenta catalogo={catalogo} />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-amarillo h-11 px-8 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
          disabled={pendiente}
        >
          {pendiente ? "Registrando Recepción..." : "Confirmar Recepción y Asentar Stock"}
        </button>
      </div>
    </form>
  );
}
