"use client";

import { RefObject } from "react";
import { cobrarAction } from "@/app/actions";
import type { ItemCarritoPOS } from "./tipos";

interface FormCobroHiddenProps {
  formRef: RefObject<HTMLFormElement | null>;
  cliente: string;
  clienteId: string;
  carrito: ItemCarritoPOS[];
  cotizacionId?: string;
  datosCobro: any;
}

export function FormCobroHidden({
  formRef,
  cliente,
  clienteId,
  carrito,
  cotizacionId,
  datosCobro,
}: FormCobroHiddenProps) {
  return (
    <form ref={formRef} action={cobrarAction} className="hidden">
      <input type="hidden" name="cliente" value={cliente} />
      <input type="hidden" name="clienteId" value={clienteId} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          carrito.map((i) => ({
            productoId: i.producto.id,
            cantidad: i.cantidad,
            precioPersonalizado: i.precioPersonalizado,
            descuentoUnitario: i.descuentoUnitario,
            cotizacionItemId: i.cotizacionItemId,
            cotizacionId: i.cotizacionId,
          })),
        )}
      />
      {cotizacionId && <input type="hidden" name="cotizacionId" value={cotizacionId} />}
      {datosCobro && (
        <>
          <input type="hidden" name="pago" value={datosCobro.pago} />
          {datosCobro.efectivoRecibido && <input type="hidden" name="recibido" value={datosCobro.efectivoRecibido} />}
          {datosCobro.bancoDestino && <input type="hidden" name="bancoDestino" value={datosCobro.bancoDestino} />}
          {datosCobro.referenciaBancaria && <input type="hidden" name="referenciaBancaria" value={datosCobro.referenciaBancaria} />}
          {datosCobro.montoEfectivoMixto && <input type="hidden" name="montoEfectivoMixto" value={datosCobro.montoEfectivoMixto} />}
          {datosCobro.montoTransferenciaMixto && <input type="hidden" name="montoTransferenciaMixto" value={datosCobro.montoTransferenciaMixto} />}
          {datosCobro.notasVenta && <input type="hidden" name="notas" value={datosCobro.notasVenta} />}
        </>
      )}
    </form>
  );
}
