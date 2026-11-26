"use client";

import { useMemo, useState } from "react";
import type { OpcionVenta } from "../venta/tipos";
import type { FilaCompraDoc } from "./FilaArticuloCompraDocumento";

export function useCompraArticulos(
  catalogo: OpcionVenta[],
  porcentajeImpuesto = 15,
  filasIniciales: FilaCompraDoc[] = [],
) {
  const [filas, setFilas] = useState<FilaCompraDoc[]>(filasIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [desplegable, setDesplegable] = useState(false);

  const resultadosBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return catalogo
      .filter((p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [catalogo, busqueda]);

  const agregarArticulo = (art: OpcionVenta) => {
    setFilas((prev) => {
      const existe = prev.find((f) => f.productoId === art.id);
      if (existe) {
        return prev.map((f) => (f.productoId === art.id ? { ...f, cantidad: f.cantidad + 1 } : f));
      }
      return [...prev, { productoId: art.id, cantidad: 1, costo: art.precio, observacion: "" }];
    });
    setBusqueda("");
    setDesplegable(false);
  };

  const actualizarFila = (i: number, delta: Partial<FilaCompraDoc>) => {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...delta } : f)));
  };

  const quitarFila = (i: number) => setFilas((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal = useMemo(() => filas.reduce((acc, f) => acc + f.cantidad * f.costo, 0), [filas]);
  const iva = Math.round(subtotal * (porcentajeImpuesto / 100) * 100) / 100;
  const total = subtotal + iva;
  const payload = filas.map((f) => ({
    productoId: f.productoId,
    cantidad: f.cantidad,
    precio: f.costo,
    observacion: f.observacion,
  }));

  return {
    filas,
    busqueda,
    setBusqueda,
    desplegable,
    setDesplegable,
    resultadosBusqueda,
    agregarArticulo,
    actualizarFila,
    quitarFila,
    subtotal,
    iva,
    total,
    payload,
  };
}
