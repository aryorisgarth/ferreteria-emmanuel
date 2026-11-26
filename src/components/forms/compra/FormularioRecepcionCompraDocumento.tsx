"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import { crearRecepcionCompraAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import type { PedidoCompra, Proveedor } from "@/lib/types";
import type { OpcionVenta } from "../venta/tipos";
import { TablaArticulosCompraDocumento } from "./TablaArticulosCompraDocumento";
import { ModalNuevoProveedorCompra } from "./ModalNuevoProveedorCompra";
import { useCompraArticulos } from "./useCompraArticulos";

const inicial: ResultadoAccion = null;

interface FormularioRecepcionProps {
  catalogo: OpcionVenta[];
  proveedores: Proveedor[];
  pedidosPendientes?: PedidoCompra[];
  pedidoInicial?: PedidoCompra | null;
  fecha: string;
}

export function FormularioRecepcionCompraDocumento({
  catalogo, proveedores, pedidosPendientes = [], pedidoInicial = null, fecha,
}: FormularioRecepcionProps) {
  const [estado, accion, pendiente] = useActionState(crearRecepcionCompraAction, inicial);
  const [listaProveedores, setListaProveedores] = useState<Proveedor[]>(proveedores);
  const [pedidoId, setPedidoId] = useState(pedidoInicial?.id || "");
  const [proveedorNombre, setProveedorNombre] = useState(pedidoInicial?.proveedor || "");
  const [proveedorId, setProveedorId] = useState(pedidoInicial?.proveedorId || "");
  const [modalProveedor, setModalProveedor] = useState(false);

  const art = useCompraArticulos(catalogo, 15);

  const alCambiarPedido = (id: string) => {
    setPedidoId(id);
    const p = pedidosPendientes.find((item) => item.id === id);
    if (p) { setProveedorNombre(p.proveedor); setProveedorId(p.proveedorId || ""); }
  };

  return (
    <>
      <form action={accion} className="space-y-4">
        <input type="hidden" name="items" value={JSON.stringify(art.payload)} />
        <input type="hidden" name="proveedorId" value={proveedorId} />
        <input type="hidden" name="pedidoId" value={pedidoId} />
        <input type="hidden" name="fecha" value={fecha} />
        {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

        <div className="bg-white rounded border border-slate-300 p-6 md:p-8 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
            <Logo variante="color" className="h-8 sm:h-9 w-auto shrink-0" />
            <h1 className="text-sm sm:text-base font-bold text-[#1e40af] tracking-wide uppercase text-center flex-1">
              Comprobante de Recepción Física de Mercancía
            </h1>
            <div className="font-mono text-xs font-bold text-slate-900 whitespace-nowrap">FECHA: {fecha}</div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <span className="font-bold text-slate-900 whitespace-nowrap">Proveedor / Distribuidora:</span>
              <div className="flex-1 flex items-center gap-2 border-b border-slate-300 pb-0.5">
                <input
                  name="proveedor" list="prov-recep" required value={proveedorNombre}
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
              <datalist id="prov-recep">
                {listaProveedores.map((p) => <option key={p.id} value={p.nombre} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-300 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Guía / Remisión:</span>
                <input name="remisionProveedor" placeholder="Ej. REM-99124" className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Conformidad:</span>
                <select name="estadoConformidad" className="bg-transparent text-xs font-bold text-slate-800 outline-none">
                  <option value="CONFORME">Conforme (Completo)</option>
                  <option value="INCOMPLETO">Incompleto (Parcial)</option>
                  <option value="CON_DANOS">Con Daños / Observado</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Orden Previa:</span>
                <select value={pedidoId} onChange={(e) => alCambiarPedido(e.target.value)} className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none">
                  <option value="">— Sin orden —</option>
                  {pedidosPendientes.map((p) => <option key={p.id} value={p.id}>Orden #{p.numero}</option>)}
                </select>
              </div>
            </div>
          </div>

          <TablaArticulosCompraDocumento
            catalogo={catalogo} filas={art.filas} busquedaArticulo={art.busqueda}
            setBusquedaArticulo={art.setBusqueda} desplegableAbierto={art.desplegable}
            setDesplegableAbierto={art.setDesplegable} resultadosBusqueda={art.resultadosBusqueda}
            onAgregarArticulo={art.agregarArticulo} onActualizarFila={art.actualizarFila}
            onQuitarFila={art.quitarFila} subtotal={art.subtotal} iva={art.iva} total={art.total}
            simboloMoneda="C$" porcentajeImpuesto={15}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs flex-1 w-full">
              <span className="font-bold text-slate-900 uppercase whitespace-nowrap">Notas de Inspección:</span>
              <input name="notas" placeholder="Mercancía inspeccionada en muelle de descarga..." className="w-full border-b border-slate-300 bg-transparent text-xs text-slate-700 outline-none" />
            </div>

            <button
              type="submit"
              disabled={pendiente || art.filas.length === 0}
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-7 py-2.5 rounded text-xs font-bold transition shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              {pendiente ? "Registrando recepción..." : "Confirmar recepción física y asentar stock"}
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
