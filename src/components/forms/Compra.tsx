"use client";

import { useActionState, useState } from "react";
import { Plus, Truck, UserPlus, CreditCard, DollarSign } from "lucide-react";
import { crearCompraAction, guardarProveedorAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import { CapturaVenta, type OpcionVenta } from "@/components/forms/Venta";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Proveedor, RecepcionCompra } from "@/lib/types";

const inicial: ResultadoAccion = null;

export function FormularioCompra({
  catalogo,
  proveedores,
  fecha,
  recepcionesPendientes = [],
  recepcionInicialId = "",
  porcentajeIva = 15,
  nombreImpuesto = "I.V.A.",
}: {
  catalogo: OpcionVenta[];
  proveedores: Proveedor[];
  fecha: string;
  recepcionesPendientes?: RecepcionCompra[];
  recepcionInicialId?: string;
  porcentajeIva?: number;
  nombreImpuesto?: string;
}) {
  const { toast } = useToast();
  const [estado, accion, pendiente] = useActionState(crearCompraAction, inicial);
  const [listaProveedores, setListaProveedores] = useState<Proveedor[]>(proveedores);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");
  const [modalProveedorAbierto, setModalProveedorAbierto] = useState(false);
  const [condicionPago, setCondicionPago] = useState<"CONTADO" | "CREDITO">("CONTADO");
  const [recepcionId, setRecepcionId] = useState(recepcionInicialId);
  const [tipoIva, setTipoIva] = useState<"GENERAL" | "EXENTO" | "MANUAL">("GENERAL");
  const [valorIva, setValorIva] = useState("");

  return (
    <>
      <form action={accion} className="space-y-6">
        {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Datos de la Factura de Compra / Proveedor</h3>
            <span className="text-xs text-slate-500 font-medium">
              {recepcionId
                ? "Vinculada a recepción previa: El stock físico ya fue ingresado."
                : "Compra directa: El inventario se incrementará inmediatamente en el kárdex."}
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
                placeholder="Nombre de la distribuidora o fabricante"
              />
              <datalist id="proveedores-lista">
                {listaProveedores.map((p) => (
                  <option key={p.id} value={p.nombre} />
                ))}
              </datalist>
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Fecha Contable / Emisión *
              </span>
              <input
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
                type="date"
                name="fecha"
                defaultValue={fecha}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                No. Factura del Proveedor
              </span>
              <input
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                name="facturaProveedor"
                placeholder="Ej. FAC-0012948"
              />
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Condición de Pago
              </span>
              <select
                name="condicionPago"
                value={condicionPago}
                onChange={(e) => setCondicionPago(e.target.value as "CONTADO" | "CREDITO")}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
              >
                <option value="CONTADO">Contado (Pago Inmediato)</option>
                <option value="CREDITO">Crédito (Genera Cuenta por Pagar)</option>
              </select>
            </div>
          </div>

          {condicionPago === "CONTADO" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Forma de Pago
                </span>
                <select
                  name="formaPago"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
                >
                  <option value="EFECTIVO">Efectivo (Caja)</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Descuento Comercial (C$)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  name="descuento"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                  Días de Crédito
                </span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  defaultValue="30"
                  name="diasCredito"
                  className="h-10 w-full rounded-lg border border-amber-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono font-bold"
                />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                  Fecha de Vencimiento Estimada
                </span>
                <input
                  type="date"
                  name="fechaVencimiento"
                  className="h-10 w-full rounded-lg border border-amber-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
                />
              </div>
            </div>
          )}

          {recepcionesPendientes.length > 0 && (
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Vincular a Recepción Previa de Mercancía (Opcional)
              </span>
              <select
                name="recepcionId"
                value={recepcionId}
                onChange={(e) => setRecepcionId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
              >
                <option value="">— Compra directa con recepción inmediata —</option>
                {recepcionesPendientes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.numero} · {r.proveedor} ({r.fecha}) {r.remisionProveedor ? `· Rem: ${r.remisionProveedor}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tratamiento de {nombreImpuesto}
              </span>
              <select
                value={tipoIva}
                onChange={(e) => {
                  const val = e.target.value as "GENERAL" | "EXENTO" | "MANUAL";
                  setTipoIva(val);
                  if (val === "EXENTO") setValorIva("0");
                  else if (val === "GENERAL") setValorIva("");
                }}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-brand-yellow"
              >
                <option value="GENERAL">{nombreImpuesto} General ({porcentajeIva}%)</option>
                <option value="EXENTO">Exento de {nombreImpuesto} (0%)</option>
                <option value="MANUAL">{nombreImpuesto} Específico / Desglosado en Factura</option>
              </select>
            </div>
            {tipoIva === "MANUAL" ? (
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Monto Exacto {nombreImpuesto} Factura (C$)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="iva"
                  value={valorIva}
                  onChange={(e) => setValorIva(e.target.value)}
                  placeholder="0.00"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                />
              </div>
            ) : tipoIva === "EXENTO" ? (
              <input type="hidden" name="iva" value="0" />
            ) : null}
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Observaciones o Notas Generales
            </span>
            <input
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
              name="notas"
              placeholder="Ej. Condiciones especiales, garantía de fábrica, etc."
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Artículos de la Compra</h3>
            <p className="text-xs text-slate-500">
              Indique la cantidad facturada y el costo unitario de adquisición pactado con el proveedor.
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
            {pendiente ? "Registrando Compra..." : "Registrar Factura de Compra"}
          </button>
        </div>
      </form>

      {/* Modal para Crear Proveedor en el acto */}
      <Modal
        abierto={modalProveedorAbierto}
        alCerrar={() => setModalProveedorAbierto(false)}
        titulo="Registrar Nuevo Proveedor"
        subtitulo="Cree el distribuidor y se seleccionará automáticamente en esta compra."
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
            toast.exito(`Proveedor "${nombre}" creado y seleccionado.`);
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
                Teléfono de Pedidos
              </label>
              <input
                name="telefono"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                placeholder="+505 2222-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                R.U.C. (Nicaragua)
              </label>
              <input
                name="notas"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow font-mono"
                placeholder="J0310000000000"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Dirección
            </label>
            <input
              name="direccion"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-800 outline-none focus:border-brand-yellow"
              placeholder="Carretera Norte Km 5.5, Managua"
            />
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
