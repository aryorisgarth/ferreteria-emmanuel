"use client";

import { useMemo, useState } from "react";
import type { FilaVenta, OpcionVenta } from "./tipos";

export function useVentaArticulos(catalogo: OpcionVenta[]) {
  const primero = catalogo[0];
  const [filas, setFilas] = useState<FilaVenta[]>(
    primero
      ? [{ productoId: primero.id, cantidad: 1, precio: primero.precio, observacion: "" }]
      : []
  );

  const [busquedaArticulo, setBusquedaArticulo] = useState("");
  const [desplegableAbierto, setDesplegableAbierto] = useState(false);

  const resultadosBusqueda = useMemo(() => {
    const q = busquedaArticulo.trim().toLowerCase();
    if (!q) return [];
    return catalogo
      .filter((p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [catalogo, busquedaArticulo]);

  function agregarArticulo(art: OpcionVenta) {
    setFilas((prev) => {
      const existe = prev.find((f) => f.productoId === art.id);
      if (existe) {
        return prev.map((f) => (f.productoId === art.id ? { ...f, cantidad: f.cantidad + 1 } : f));
      }
      return [...prev, { productoId: art.id, cantidad: 1, precio: art.precio, observacion: "" }];
    });
    setBusquedaArticulo("");
    setDesplegableAbierto(false);
  }

  function actualizarFila(indice: number, delta: Partial<FilaVenta>) {
    setFilas((prev) => prev.map((f, i) => (i === indice ? { ...f, ...delta } : f)));
  }

  function quitarFila(indice: number) {
    setFilas((prev) => prev.filter((_, i) => i !== indice));
  }

  function agregarRenglonVacio() {
    if (primero) {
      setFilas((prev) => [
        ...prev,
        { productoId: primero.id, cantidad: 1, precio: primero.precio, observacion: "" },
      ]);
    }
  }

  return {
    filas,
    setFilas,
    busquedaArticulo,
    setBusquedaArticulo,
    desplegableAbierto,
    setDesplegableAbierto,
    resultadosBusqueda,
    agregarArticulo,
    actualizarFila,
    quitarFila,
    agregarRenglonVacio,
  };
}
