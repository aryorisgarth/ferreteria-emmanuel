"use client";

import { useMemo, useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { reproducirBeep } from "./utilidades-impresion";
import type { ItemCarritoPOS } from "./tipos";
import type { ProductoVista } from "@/lib/types";

export function useCarritoPos(factorImpuesto: number) {
  const { toast } = useToast();
  const [carrito, setCarrito] = useState<ItemCarritoPOS[]>([]);

  const subtotal = carrito.reduce((s, it) => {
    const p = it.precioPersonalizado !== undefined ? it.precioPersonalizado : it.producto.precio;
    return s + it.cantidad * Math.max(0, p - (it.descuentoUnitario || 0));
  }, 0);

  const iva = Math.round((carrito.filter((it) => !it.exentoIva).reduce((acc, it) => {
    const p = it.precioPersonalizado !== undefined ? it.precioPersonalizado : it.producto.precio;
    return acc + it.cantidad * Math.max(0, p - (it.descuentoUnitario || 0)) * factorImpuesto;
  }, 0) + Number.EPSILON) * 100) / 100;

  const total = Math.round((subtotal + iva + Number.EPSILON) * 100) / 100;

  const cotizacionActiva = useMemo(() => carrito.find((it) => it.esCotizacion), [carrito]);

  const agregar = useCallback((prod: ProductoVista, cant = 1) => {
    if (prod.stockActual <= 0) {
      reproducirBeep("error");
      toast.aviso(`"${prod.nombre}" está agotado en bodega.`, "Stock Agotado");
      return;
    }
    setCarrito((act) => {
      const ex = act.find((i) => i.producto.id === prod.id);
      const nueva = (ex ? ex.cantidad : 0) + cant;
      if (nueva > prod.stockActual) {
        reproducirBeep("error");
        toast.aviso(`Solo hay ${prod.stockActual} disponibles de "${prod.nombre}".`, "Límite Excedido");
        return act;
      }
      reproducirBeep("ok");
      if (ex) return act.map((i) => i.producto.id === prod.id ? { ...i, cantidad: nueva } : i);
      return [...act, { producto: prod, cantidad: cant }];
    });
  }, [toast]);

  const cambiarCantidad = (id: string, delta: number, cotId?: string) => {
    setCarrito((act) => act.map((i) => {
      if ((cotId ? i.producto.id === id && i.cotizacionItemId === cotId : i.producto.id === id)) {
        const n = Math.round((i.cantidad + delta) * 1000) / 1000;
        const max = i.esCotizacion && i.cantidadMaximaPermitida ? Math.min(i.producto.stockActual, i.cantidadMaximaPermitida) : i.producto.stockActual;
        return n > max ? i : { ...i, cantidad: n };
      }
      return i;
    }).filter((i) => i.cantidad > 0));
  };

  const fijarCantidad = (id: string, cant: number, cotId?: string) => {
    if (cant <= 0) return setCarrito((act) => act.filter((i) => cotId ? !(i.producto.id === id && i.cotizacionItemId === cotId) : i.producto.id !== id));
    setCarrito((act) => act.map((i) => {
      if ((cotId ? i.producto.id === id && i.cotizacionItemId === cotId : i.producto.id === id)) {
        const max = i.esCotizacion && i.cantidadMaximaPermitida ? Math.min(i.producto.stockActual, i.cantidadMaximaPermitida) : i.producto.stockActual;
        return { ...i, cantidad: Math.min(cant, max) };
      }
      return i;
    }));
  };

  const eliminar = (id: string, cotId?: string) => {
    setCarrito((act) => act.filter((i) => cotId ? !(i.producto.id === id && i.cotizacionItemId === cotId) : i.producto.id !== id));
  };

  const importarCotizacion = (datos: any) => {
    setCarrito((act) => {
      const nuevo = [...act];
      datos.itemsAImportar.forEach((imp: any) => {
        const item: ItemCarritoPOS = {
          producto: imp.producto,
          cantidad: imp.cantidad,
          precioPersonalizado: imp.precioPersonalizado,
          descuentoUnitario: imp.descuentoUnitario,
          exentoIva: imp.exentoIva,
          esCotizacion: true,
          cotizacionId: datos.cotizacionId,
          cotizacionNumero: datos.cotizacionNumero,
          cotizacionVersion: datos.cotizacionVersion,
          cotizacionItemId: imp.cotizacionItemId,
          cantidadMaximaPermitida: imp.cantidadMaximaPermitida,
        };
        const idx = nuevo.findIndex((x) => x.producto.id === imp.producto.id || (x.cotizacionItemId && x.cotizacionItemId === imp.cotizacionItemId));
        if (idx >= 0) nuevo[idx] = item; else nuevo.push(item);
      });
      return nuevo;
    });
    toast.exito(`Cotización ${datos.cotizacionNumero} importada con precios congelados.`, "Cotización Cargada");
  };

  return {
    carrito,
    setCarrito,
    subtotal,
    iva,
    total,
    cotizacionActiva,
    agregar,
    cambiarCantidad,
    fijarCantidad,
    eliminar,
    importarCotizacion,
  };
}
