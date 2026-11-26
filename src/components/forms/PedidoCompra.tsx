"use client";

import { useActionState, useState } from "react";
import { Plus, ClipboardList, UserPlus } from "lucide-react";
import { crearPedidoCompraAction, guardarProveedorAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import { CapturaVenta, type OpcionVenta } from "@/components/forms/Venta";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Proveedor } from "@/lib/types";

const inicial: ResultadoAccion = null;

export function FormularioPedidoCompra({
  catalogo,
  proveedores,
  fecha,
}: {
  catalogo: OpcionVenta[];
  proveedores: Proveedor[];
  fecha: string;
}) {
  const { toast } = useToast();
  const [estado, accion, pendiente] = useActionState(crearPedidoCompraAction, inicial);
  const [listaProveedores, setListaProveedores] = useState<Proveedor[]>(proveedores);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");
  const [modalProveedorAbierto, setModalProveedorAbierto] = useState(false);

  return (
    <>
      <form action={accion} className="space-y-6">
        {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Datos de la Orden / Pedido de Compra</h3>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold border border-amber-200">
              Nota: El pedido NO incrementa existencias ni altera el Kárdex hasta la recepción física.
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Distribuidora / Proveedor *
                </span>
                <button
                  type="button"
                  onClick={() => setModalProveedorAbierto(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
                >
                  <UserPlus size={13} />
                  + Nuevo Proveedor
                </button>
              </div>
              <input
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
                name="proveedor"
                list="proveedores-lista"
                required
                value={proveedorSeleccionado}
                onChange={(e) => setProveedorSeleccionado(e.target.value)}
                placeholder="Nombre de la empresa proveedora"
              />
              <datalist id="proveedores-lista">
                {listaProveedores.map((p) => (
                  <option key={p.id} value={p.nombre} />
                ))}
              </datalist>
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Fecha de Emisión del Pedido *
              </span>
              <input
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
                type="date"
                name="fechaEmision"
                defaultValue={fecha}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Fecha Estimada de Entrega
              </span>
              <input
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
                type="date"
                name="fechaEntregaEstimada"
              />
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Condiciones de Pago / Entrega Solicitada
              </span>
              <input
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
                name="notas"
                placeholder="Ej. Entrega en bodega central, crédito acordado a 30 días..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Artículos Solicitados</h3>
            <p className="text-xs text-slate-500">
              Indique la cantidad requerida y el precio unitario pactado o cotizado de referencia.
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
            {pendiente ? "Generando Pedido..." : "Emitir Pedido de Compra"}
          </button>
        </div>
      </form>

      {/* Modal para Crear Proveedor */}
      <Modal
        abierto={modalProveedorAbierto}
        alCerrar={() => setModalProveedorAbierto(false)}
        titulo="Registrar Nuevo Proveedor"
        subtitulo="Cree el distribuidor y se seleccionará automáticamente en esta orden."
      >
        <form
          action={async (formData) => {
            const nombre = String(formData.get("nombre") || "");
            const res = await guardarProveedorAction(null as any, formData);
            if (res && !res.ok) {
              toast.error(res.error || "No se pudo registrar el proveedor.", "Error");
              return;
            }
            setListaProveedores((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                nombre,
                telefono: String(formData.get("telefono") || ""),
                direccion: String(formData.get("direccion") || ""),
                notas: String(formData.get("notas") || ""),
              },
            ]);
            setProveedorSeleccionado(nombre);
            toast.exito(`Proveedor "${nombre}" creado.`);
            setModalProveedorAbierto(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nombre de la Distribuidora *
            </label>
            <input
              name="nombre"
              required
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
              placeholder="Ej. Distribuidora Holcim Nicaragua"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                name="telefono"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none font-mono"
                placeholder="+505 2222-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                R.U.C.
              </label>
              <input
                name="notas"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none font-mono"
                placeholder="J0310000000000"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalProveedorAbierto(false)}
              className="btn btn-linea h-10 px-4 text-xs font-bold"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-amarillo h-10 px-5 text-xs font-bold shadow-xs">
              Guardar y Seleccionar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
