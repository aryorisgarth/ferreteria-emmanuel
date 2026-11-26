"use client";

import { useState } from "react";
import type { ConteoFisico, ProductoVista, TipoAjusteInventario } from "@/lib/types";
import type { LineaNuevoConteo } from "./tipos";

export function useModalesInventario(productosIniciales: ProductoVista[]) {
  // Modal Producto
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [articuloEditando, setArticuloEditando] = useState<ProductoVista | null>(null);
  const [costoModal, setCostoModal] = useState<number>(0);
  const [precioModal, setPrecioModal] = useState<number>(0);

  const abrirNuevoProducto = () => {
    setArticuloEditando(null);
    setCostoModal(0);
    setPrecioModal(0);
    setModalProductoAbierto(true);
  };

  const abrirEditarProducto = (prod: ProductoVista) => {
    setArticuloEditando(prod);
    setCostoModal(prod.costo || 0);
    setPrecioModal(prod.precio || 0);
    setModalProductoAbierto(true);
  };

  // Modal Ajuste
  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false);
  const [ajusteProductoId, setAjusteProductoId] = useState<string>("");
  const [ajusteTipo, setAjusteTipo] = useState<TipoAjusteInventario>("SOBRANTE");
  const [ajusteCantidad, setAjusteCantidad] = useState<number>(1);
  const [ajusteMotivo, setAjusteMotivo] = useState("");
  const [ajusteCostoReferencia, setAjusteCostoReferencia] = useState<number>(0);

  const abrirNuevoAjuste = () => {
    if (productosIniciales.length > 0 && !ajusteProductoId) {
      setAjusteProductoId(productosIniciales[0].id);
    }
    setAjusteTipo("SOBRANTE");
    setAjusteCantidad(1);
    setAjusteMotivo("");
    setAjusteCostoReferencia(0);
    setModalAjusteAbierto(true);
  };

  // Modal Conteo
  const [modalConteoAbierto, setModalConteoAbierto] = useState(false);
  const [modalDetalleConteo, setModalDetalleConteo] = useState<ConteoFisico | null>(null);
  const [conteoFecha, setConteoFecha] = useState(new Date().toISOString().slice(0, 10));
  const [conteoNotas, setConteoNotas] = useState("");
  const [conteoLineas, setConteoLineas] = useState<LineaNuevoConteo[]>([]);

  const abrirNuevoConteo = () => {
    setConteoFecha(new Date().toISOString().slice(0, 10));
    setConteoNotas("");
    const items: LineaNuevoConteo[] = productosIniciales
      .filter((p) => p.activo !== false)
      .map((p) => ({
        productoId: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        unidadMedida: p.unidadMedida,
        stockSistema: p.stockActual,
        conteoFisico: p.stockActual,
        observacion: "",
      }));
    setConteoLineas(items);
    setModalConteoAbierto(true);
  };

  return {
    modalProductoAbierto,
    setModalProductoAbierto,
    articuloEditando,
    costoModal,
    setCostoModal,
    precioModal,
    setPrecioModal,
    abrirNuevoProducto,
    abrirEditarProducto,
    modalAjusteAbierto,
    setModalAjusteAbierto,
    ajusteProductoId,
    setAjusteProductoId,
    ajusteTipo,
    setAjusteTipo,
    ajusteCantidad,
    setAjusteCantidad,
    ajusteMotivo,
    setAjusteMotivo,
    ajusteCostoReferencia,
    setAjusteCostoReferencia,
    abrirNuevoAjuste,
    modalConteoAbierto,
    setModalConteoAbierto,
    modalDetalleConteo,
    setModalDetalleConteo,
    conteoFecha,
    setConteoFecha,
    conteoNotas,
    setConteoNotas,
    conteoLineas,
    setConteoLineas,
    abrirNuevoConteo,
  };
}
