"use client";

import { useActionState, useState } from "react";
import {
  crearCotizacionAction,
  crearFacturaAction,
} from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { Aviso } from "@/components/documentos/Pieza";
import { dinero } from "@/lib/format";
import type { Cliente } from "@/lib/types";
import type { FormaPagoFactura, FormularioVentaProps } from "./tipos";
import { useVentaArticulos } from "./useVentaArticulos";
import { useVentaTotales } from "./useVentaTotales";
import { DatosGeneralesVenta } from "./DatosGeneralesVenta";
import { TablaArticulosVentaForm } from "./TablaArticulosVentaForm";
import { ModalNuevoClienteVenta } from "./ModalNuevoClienteVenta";

const inicial: ResultadoAccion = null;

export function FormularioVentaOrquestador({
  catalogo,
  fecha,
  modo,
  clientes = [],
  simboloMoneda = "C$",
  porcentajeImpuesto = 15,
}: FormularioVentaProps) {
  const accionBase = modo === "cotizacion" ? crearCotizacionAction : crearFacturaAction;
  const [estado, accion, pendiente] = useActionState(accionBase, inicial);

  const [listaClientes, setListaClientes] = useState<Cliente[]>(clientes);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [formaPago, setFormaPago] = useState<FormaPagoFactura>("EFECTIVO");

  const art = useVentaArticulos(catalogo);
  const tot = useVentaTotales(art.filas, porcentajeImpuesto);

  return (
    <>
      <form action={accion} className="space-y-6">
        <input type="hidden" name="items" value={JSON.stringify(tot.payload)} />
        <input type="hidden" name="clienteId" value={clienteId} />

        {estado?.error ? <Aviso tono="rojo">{estado.error}</Aviso> : null}

        <DatosGeneralesVenta
          modo={modo}
          simboloMoneda={simboloMoneda}
          porcentajeImpuesto={porcentajeImpuesto}
          listaClientes={listaClientes}
          clienteNombre={clienteNombre}
          setClienteNombre={setClienteNombre}
          setClienteId={setClienteId}
          fecha={fecha}
          formaPago={formaPago}
          setFormaPago={setFormaPago}
          onAbrirModalCliente={() => setModalClienteAbierto(true)}
        />

        <TablaArticulosVentaForm
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
          onAgregarRenglonVacio={art.agregarRenglonVacio}
          subtotal={tot.subtotal}
          iva={tot.iva}
          total={tot.total}
          porcentajeImpuesto={porcentajeImpuesto}
          simboloMoneda={simboloMoneda}
          modo={modo}
        />

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={pendiente || tot.payload.length === 0}
            className="btn btn-amarillo h-11 px-8 text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            {pendiente
              ? "Procesando documento..."
              : modo === "cotizacion"
              ? `Generar y Guardar Cotización (${dinero(tot.total, simboloMoneda)})`
              : `Generar y Emitir Factura (${dinero(tot.total, simboloMoneda)})`}
          </button>
        </div>
      </form>

      <ModalNuevoClienteVenta
        abierto={modalClienteAbierto}
        alCerrar={() => setModalClienteAbierto(false)}
        onClienteCreado={(nuevo) => {
          setListaClientes((prev) => [...prev, nuevo]);
          setClienteNombre(nuevo.nombre);
          setClienteId(nuevo.id);
        }}
      />
    </>
  );
}
