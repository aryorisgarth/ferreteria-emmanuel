"use client";

import { useState } from "react";
import type { InventarioCrudProps, TabInventario } from "./tipos";
import { useInventarioFiltros } from "./useInventarioFiltros";
import { useModalesInventario } from "./useModalesInventario";
import { useAccionesArticulo } from "./useAccionesArticulo";
import { PestanasInventario } from "./PestanasInventario";
import { KpisInventario } from "./KpisInventario";
import { FiltrosProductos } from "./FiltrosProductos";
import { TablaProductos } from "./TablaProductos";
import { PestanaAjustes } from "./PestanaAjustes";
import { PestanaConteos } from "./PestanaConteos";
import { ModalProducto } from "./ModalProducto";
import { ModalAjusteInventario } from "./ModalAjusteInventario";
import { ModalNuevoConteo } from "./ModalNuevoConteo";
import { ModalDetalleConteo } from "./ModalDetalleConteo";

export function InventarioOrquestador(props: InventarioCrudProps) {
  const [tab, setTab] = useState<TabInventario>(
    props.tabInicial === "ajustes" || props.tabInicial === "conteos" ? props.tabInicial : "productos"
  );
  const f = useInventarioFiltros(props, tab);
  const m = useModalesInventario(props.productosIniciales);
  const { onActivarDesactivar, onEliminar } = useAccionesArticulo();

  return (
    <div className="space-y-5">
      <PestanasInventario
        tab={tab} setTab={setTab}
        totalArticulos={f.totalArticulos}
        totalAjustes={props.ajustesIniciales?.length ?? 0}
        totalConteos={props.conteosIniciales?.length ?? 0}
        onNuevoArticulo={m.abrirNuevoProducto}
        onNuevoAjuste={m.abrirNuevoAjuste}
        onNuevoConteo={m.abrirNuevoConteo}
      />

      {tab === "productos" && (
        <div className="space-y-4">
          <KpisInventario
            totalArticulos={f.totalArticulos}
            stockBajoCount={f.stockBajoCount}
            valorInventario={f.valorInventario}
            soloStockBajo={f.soloStockBajo}
            onToggleStockBajo={() => {
              const nuevo = !f.soloStockBajo;
              f.setSoloStockBajo(nuevo);
              f.actualizarFiltrosUrl({ soloStockBajo: nuevo, page: 1 });
            }}
            esAdmin={Boolean(props.esAdmin)}
          />

          <FiltrosProductos
            q={f.q} setQ={f.setQ}
            categoriaSel={f.categoriaSel} setCategoriaSel={f.setCategoriaSel}
            categoriasDisponibles={props.categoriasDisponibles}
            marcaSel={f.marcaSel} setMarcaSel={f.setMarcaSel}
            marcasOpciones={f.marcasOpciones}
            estadoSel={f.estadoSel} setEstadoSel={f.setEstadoSel}
            totalArticulosFiltrados={f.totalArticulosFiltrados}
            onCambioFiltro={f.actualizarFiltrosUrl}
          />

          <TablaProductos
            productosVisibles={f.productosVisibles}
            esAdmin={Boolean(props.esAdmin)}
            totalArticulosFiltrados={f.totalArticulosFiltrados}
            totalPaginas={f.totalPaginas}
            paginaActual={f.paginaActual}
            inicioPaginacion={f.inicioPaginacion}
            itemsPorPagina={f.ITEMS_POR_PAGINA}
            onEditar={m.abrirEditarProducto}
            onActivarDesactivar={onActivarDesactivar}
            onEliminar={onEliminar}
            onCambioPagina={(pag) =>
              f.esPaginacionServidor ? f.actualizarFiltrosUrl({ page: pag }) : f.setPaginaActualLocal(pag)
            }
          />
        </div>
      )}

      {tab === "ajustes" && (
        <PestanaAjustes
          ajustesIniciales={props.ajustesIniciales ?? []}
          productosIniciales={props.productosIniciales}
        />
      )}

      {tab === "conteos" && (
        <PestanaConteos
          conteosIniciales={props.conteosIniciales ?? []}
          onIniciarConteo={m.abrirNuevoConteo}
          onVerDetalle={(c) => m.setModalDetalleConteo(c)}
        />
      )}

      <ModalProducto
        abierto={m.modalProductoAbierto}
        alCerrar={() => m.setModalProductoAbierto(false)}
        articuloEditando={m.articuloEditando}
        categoriasDisponibles={props.categoriasDisponibles}
        marcasOpciones={f.marcasOpciones}
        costoModal={m.costoModal} setCostoModal={m.setCostoModal}
        precioModal={m.precioModal} setPrecioModal={m.setPrecioModal}
        esAdmin={Boolean(props.esAdmin)}
      />

      <ModalAjusteInventario
        abierto={m.modalAjusteAbierto}
        alCerrar={() => m.setModalAjusteAbierto(false)}
        productosIniciales={props.productosIniciales}
        ajusteProductoId={m.ajusteProductoId} setAjusteProductoId={m.setAjusteProductoId}
        ajusteTipo={m.ajusteTipo} setAjusteTipo={m.setAjusteTipo}
        ajusteCantidad={m.ajusteCantidad} setAjusteCantidad={m.setAjusteCantidad}
        ajusteMotivo={m.ajusteMotivo} setAjusteMotivo={m.setAjusteMotivo}
        ajusteCostoReferencia={m.ajusteCostoReferencia} setAjusteCostoReferencia={m.setAjusteCostoReferencia}
      />

      <ModalNuevoConteo
        abierto={m.modalConteoAbierto}
        alCerrar={() => m.setModalConteoAbierto(false)}
        conteoFecha={m.conteoFecha} setConteoFecha={m.setConteoFecha}
        conteoNotas={m.conteoNotas} setConteoNotas={m.setConteoNotas}
        conteoLineas={m.conteoLineas} setConteoLineas={m.setConteoLineas}
      />

      <ModalDetalleConteo
        conteo={m.modalDetalleConteo}
        alCerrar={() => m.setModalDetalleConteo(null)}
        productosIniciales={props.productosIniciales}
      />
    </div>
  );
}
