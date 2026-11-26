"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { Logo } from "@/components/marca/Logo";
import { crearFacturaAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import type { Cliente } from "@/lib/types";
import type { FormaPagoFactura, FormularioVentaProps } from "../venta/tipos";
import { useVentaArticulos } from "../venta/useVentaArticulos";
import { useVentaTotales } from "../venta/useVentaTotales";
import { TablaArticulosDocumento } from "../cotizacion/TablaArticulosDocumento";
import { ModalNuevoClienteVenta } from "../venta/ModalNuevoClienteVenta";

const inicial: ResultadoAccion = null;

export function FormularioFacturaDocumento({
  catalogo,
  fecha,
  clientes = [],
  simboloMoneda = "C$",
  porcentajeImpuesto = 15,
}: FormularioVentaProps) {
  const [estado, accion, pendiente] = useActionState(crearFacturaAction, inicial);
  const [listaClientes, setListaClientes] = useState<Cliente[]>(clientes);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [formaPago, setFormaPago] = useState<FormaPagoFactura>("EFECTIVO");
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);

  const art = useVentaArticulos(catalogo);
  const tot = useVentaTotales(art.filas, porcentajeImpuesto);

  return (
    <>
      <form action={accion} className="space-y-4">
        <input type="hidden" name="items" value={JSON.stringify(tot.payload)} />
        <input type="hidden" name="clienteId" value={clienteId} />
        <input type="hidden" name="fecha" value={fecha} />
        <input type="hidden" name="origen" value="DIRECTA" />
        {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

        <div className="bg-white rounded border border-slate-300 p-6 md:p-8 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
            <Logo variante="color" className="h-8 sm:h-9 w-auto shrink-0" />
            <h1 className="text-sm sm:text-base font-bold text-[#1e40af] tracking-wide uppercase text-center flex-1">
              Factura de Venta Directa
            </h1>
            <div className="font-mono text-xs font-bold text-slate-900 whitespace-nowrap">FECHA: {fecha}</div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <span className="font-bold text-slate-900 whitespace-nowrap">Cliente:</span>
              <div className="flex-1 flex items-center gap-2 border-b border-slate-300 pb-0.5">
                <input
                  name="cliente" list="clientes-factura" required value={clienteNombre}
                  onChange={(e) => {
                    setClienteNombre(e.target.value);
                    const h = listaClientes.find((c) => c.nombre.toLowerCase() === e.target.value.toLowerCase());
                    setClienteId(h?.id ?? "");
                  }}
                  placeholder="Escribe el nombre o razón social del cliente..."
                  className="w-full bg-transparent text-xs font-bold uppercase text-slate-900 outline-none"
                />
                <button
                  type="button" onClick={() => setModalClienteAbierto(true)}
                  className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <UserPlus size={12} /> + Nuevo
                </button>
              </div>
              <datalist id="clientes-factura">
                {listaClientes.map((c) => <option key={c.id} value={c.nombre} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-300 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Destino / Entrega:</span>
                <input
                  name="notas"
                  placeholder="Ej. Managua, Masaya o entrega en mostrador"
                  className="w-full bg-transparent text-xs text-slate-700 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Forma de Pago:</span>
                <select
                  name="formaPago"
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value as FormaPagoFactura)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="TARJETA">Tarjeta Débito/Crédito</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>
          </div>

          <TablaArticulosDocumento
            catalogo={catalogo}
            filas={art.filas}
            busquedaArticulo={art.busquedaArticulo}
            setBusquedaArticulo={art.setBusquedaArticulo}
            desplegableAbierto={art.desplegableAbierto}
            setDesplegableAbierto={art.setDesplegableAbierto}
            resultadosBusqueda={art.resultadosBusqueda}
            onAgregarArticulo={art.agregarArticulo}
            onActualizarFila={art.actualizarFila}
            onQuitarFila={art.quitarFila}
            subtotal={tot.subtotal}
            iva={tot.iva}
            total={tot.total}
            simboloMoneda={simboloMoneda}
            porcentajeImpuesto={porcentajeImpuesto}
          />

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={pendiente || tot.payload.length === 0}
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-7 py-2.5 rounded text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {pendiente ? "Emitiendo factura..." : "Emitir y guardar factura de venta"}
            </button>
          </div>
        </div>
      </form>

      <ModalNuevoClienteVenta
        abierto={modalClienteAbierto}
        alCerrar={() => setModalClienteAbierto(false)}
        onClienteCreado={(c) => {
          setListaClientes((prev) => [...prev, c]);
          setClienteNombre(c.nombre);
          setClienteId(c.id);
        }}
      />
    </>
  );
}
