import { useMemo } from "react";
import type { FilaVenta } from "./tipos";

export function useVentaTotales(filas: FilaVenta[], porcentajeImpuesto: number) {
  const subtotal = useMemo(() => {
    return filas.reduce((acc, f) => acc + f.cantidad * f.precio, 0);
  }, [filas]);

  const factorIva = porcentajeImpuesto / 100;
  const iva = Math.round((subtotal * factorIva + Number.EPSILON) * 100) / 100;
  const total = Math.round((subtotal + iva + Number.EPSILON) * 100) / 100;

  const payload = useMemo(() => {
    return filas
      .filter((f) => f.productoId && f.cantidad > 0)
      .map((f) => ({
        productoId: f.productoId,
        cantidad: f.cantidad,
        precio: f.precio,
        observacion: f.observacion,
      }));
  }, [filas]);

  return { subtotal, iva, total, payload };
}
