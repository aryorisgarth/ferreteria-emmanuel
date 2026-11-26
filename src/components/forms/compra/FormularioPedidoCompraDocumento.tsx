"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import { crearPedidoCompraAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import type { Proveedor } from "@/lib/types";
import type { OpcionVenta } from "../venta/tipos";
import { TablaArticulosCompraDocumento } from "./TablaArticulosCompraDocumento";
import { ModalNuevoProveedorCompra } from "./ModalNuevoProveedorCompra";
import { useCompraArticulos } from "./useCompraArticulos";

const inicial: ResultadoAccion = null;

export function FormularioPedidoCompraDocumento({
  catalogo,
  proveedores,
  fecha,
  simboloMoneda = "C$",
  filasIniciales = [],
}: {
  catalogo: OpcionVenta[];
  proveedores: Proveedor[];
  fecha: string;
  simboloMoneda?: string;
  filasIniciales?: any[];
}) {
  const [estado, accion, pendiente] = useActionState(crearPedidoCompraAction, inicial);
  const [listaProveedores, setListaProveedores] = useState<Proveedor[]>(proveedores);
  const [proveedorNombre, setProveedorNombre] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [modalProveedor, setModalProveedor] = useState(false);

  const art = useCompraArticulos(catalogo, 15, filasIniciales);

  return (
    <>
      <form action={accion} className="space-y-4">
        <input type="hidden" name="items" value={JSON.stringify(art.payload)} />
        <input type="hidden" name="proveedorId" value={proveedorId} />
        <input type="hidden" name="fechaEmision" value={fecha} />
        {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

        <div className="bg-white rounded border border-slate-300 p-6 md:p-8 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
            <Logo variante="color" className="h-8 sm:h-9 w-auto shrink-0" />
            <h1 className="text-sm sm:text-base font-bold text-[#1e40af] tracking-wide uppercase text-center flex-1">
              Orden y Pedido de Compra a Proveedor
            </h1>
            <div className="font-mono text-xs font-bold text-slate-900 whitespace-nowrap">FECHA: {fecha}</div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <span className="font-bold text-slate-900 whitespace-nowrap">Proveedor / Distribuidora:</span>
              <div className="flex-1 flex items-center gap-2 border-b border-slate-300 pb-0.5">
                <input
                  name="proveedor" list="prov-pedido" required value={proveedorNombre}
                  onChange={(e) => {
                    setProveedorNombre(e.target.value);
                    const h = listaProveedores.find((p) => p.nombre.toLowerCase() === e.target.value.toLowerCase());
                    setProveedorId(h?.id ?? "");
                  }}
                  placeholder="Escribe el nombre de la distribuidora..."
                  className="w-full bg-transparent text-xs font-bold uppercase text-slate-900 outline-none"
                />
                <button
                  type="button" onClick={() => setModalProveedor(true)}
                  className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <UserPlus size={12} /> + Nuevo
                </button>
              </div>
              <datalist id="prov-pedido">
                {listaProveedores.map((p) => <option key={p.id} value={p.nombre} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-300 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Fecha Estimada Entrega:</span>
                <input
                  type="date"
                  name="fechaEntregaEstimada"
                  defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]}
                  className="border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-900 outline-none bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Condición / Destino:</span>
                <input
                  name="notas"
                  placeholder="Ej. Entrega en bodega principal central..."
                  className="w-full bg-transparent text-xs text-slate-700 outline-none"
                />
              </div>
            </div>
          </div>

          <TablaArticulosCompraDocumento
            catalogo={catalogo}
            filas={art.filas}
            busquedaArticulo={art.busqueda}
            setBusquedaArticulo={art.setBusqueda}
            desplegableAbierto={art.desplegable}
            setDesplegableAbierto={art.setDesplegable}
            resultadosBusqueda={art.resultadosBusqueda}
            onAgregarArticulo={art.agregarArticulo}
            onActualizarFila={art.actualizarFila}
            onQuitarFila={art.quitarFila}
            subtotal={art.subtotal}
            iva={art.iva}
            total={art.total}
            simboloMoneda={simboloMoneda}
            porcentajeImpuesto={15}
          />

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={pendiente || art.filas.length === 0}
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-7 py-2.5 rounded text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {pendiente ? "Generando orden..." : "Emitir orden y pedido de compra"}
            </button>
          </div>
        </div>
      </form>

      <ModalNuevoProveedorCompra
        abierto={modalProveedor}
        alCerrar={() => setModalProveedor(false)}
        onProveedorCreado={(p) => {
          setListaProveedores((prev) => [...prev, p]);
          setProveedorNombre(p.nombre);
          setProveedorId(p.id);
        }}
      />
    </>
  );
}
