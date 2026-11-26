"use client";

import { useActionState, useState } from "react";
import { crearCompraAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import type { Proveedor, RecepcionCompra } from "@/lib/types";
import type { OpcionVenta } from "../venta/tipos";
import { TablaArticulosCompraDocumento } from "./TablaArticulosCompraDocumento";
import { ModalNuevoProveedorCompra } from "./ModalNuevoProveedorCompra";
import { CabeceraCompraDocumento } from "./CabeceraCompraDocumento";
import { useCompraArticulos } from "./useCompraArticulos";

const inicial: ResultadoAccion = null;

export function FormularioCompraDocumento({
  catalogo,
  proveedores,
  fecha,
  recepcionesPendientes = [],
  recepcionInicialId = "",
  simboloMoneda = "C$",
  porcentajeImpuesto = 15,
}: {
  catalogo: OpcionVenta[];
  proveedores: Proveedor[];
  fecha: string;
  recepcionesPendientes?: RecepcionCompra[];
  recepcionInicialId?: string;
  simboloMoneda?: string;
  porcentajeImpuesto?: number;
}) {
  const [estado, accion, pendiente] = useActionState(crearCompraAction, inicial);
  const [listaProveedores, setListaProveedores] = useState<Proveedor[]>(proveedores);
  const [proveedorNombre, setProveedorNombre] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [modalProveedor, setModalProveedor] = useState(false);
  const [condicionPago, setCondicionPago] = useState<"CONTADO" | "CREDITO">("CONTADO");
  const [recepcionId, setRecepcionId] = useState(recepcionInicialId);

  const art = useCompraArticulos(catalogo, porcentajeImpuesto);

  return (
    <>
      <form action={accion} className="space-y-4">
        <input type="hidden" name="items" value={JSON.stringify(art.payload)} />
        <input type="hidden" name="proveedorId" value={proveedorId} />
        <input type="hidden" name="fecha" value={fecha} />
        <input type="hidden" name="iva" value={art.iva} />
        <input type="hidden" name="recepcionId" value={recepcionId} />
        {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

        <div className="bg-white rounded border border-slate-300 p-6 md:p-8 space-y-4 shadow-2xs">
          <CabeceraCompraDocumento
            fecha={fecha}
            proveedorNombre={proveedorNombre}
            setProveedorNombre={setProveedorNombre}
            listaProveedores={listaProveedores}
            setProveedorId={setProveedorId}
            setModalProveedor={setModalProveedor}
            condicionPago={condicionPago}
            setCondicionPago={setCondicionPago}
            recepcionesPendientes={recepcionesPendientes}
            recepcionId={recepcionId}
            setRecepcionId={setRecepcionId}
          />

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
            porcentajeImpuesto={porcentajeImpuesto}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs flex-1 w-full">
              <span className="font-bold text-slate-900 uppercase whitespace-nowrap">Observación / Notas:</span>
              <input
                name="notas"
                placeholder="Recepción en bodega principal, número de guía, etc."
                className="w-full border-b border-slate-300 bg-transparent text-xs text-slate-700 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={pendiente || art.filas.length === 0}
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-7 py-2.5 rounded text-xs font-bold transition shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              {pendiente ? "Registrando compra..." : "Registrar y guardar factura de compra"}
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
