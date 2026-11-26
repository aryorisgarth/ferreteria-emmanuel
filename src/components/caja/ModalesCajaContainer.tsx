"use client";

import { ModalCargarCotizacion } from "@/components/forms/ModalCargarCotizacion";
import { ModalCatalogoCategorias } from "./ModalCatalogoCategorias";
import { ModalCobro } from "./ModalCobro";
import { ModalTicketExitoso } from "./ModalTicketExitoso";
import { ModalesTurnoCaja } from "./ModalesTurnoCaja";
import { imprimirTicketTermico, compartirWhatsApp } from "./utilidades-impresion";
import type { Cliente, Cotizacion, ProductoVista, TurnoCaja } from "@/lib/types";
import type { ConfiguracionSistema } from "@/lib/config";

interface ModalesCajaContainerProps {
  m: any;
  catalogo: ProductoVista[];
  categoriaSel: string;
  onAgregarProducto: (p: ProductoVista, cant: number) => void;
  onCambiarCategoria: (cat: string) => void;
  categorias: string[];
  cotizaciones: Cotizacion[];
  onImportarCotizacion: (datos: any) => void;
  total: number;
  simboloMoneda: string;
  clientes: Cliente[];
  cliente: string;
  clienteId: string;
  onCambiarCliente: (nom: string, id: string) => void;
  onConfirmarCobro: (datos: any) => void;
  enviando: boolean;
  ticketExitoso: any;
  config: ConfiguracionSistema;
  onSiguienteVenta: () => void;
  turno: TurnoCaja | null;
  efectivoEsperado: number;
  difArqueo: number | null;
}

export function ModalesCajaContainer({
  m,
  catalogo,
  categoriaSel,
  onAgregarProducto,
  onCambiarCategoria,
  categorias,
  cotizaciones,
  onImportarCotizacion,
  total,
  simboloMoneda,
  clientes,
  cliente,
  clienteId,
  onCambiarCliente,
  onConfirmarCobro,
  enviando,
  ticketExitoso,
  config,
  onSiguienteVenta,
  turno,
  efectivoEsperado,
  difArqueo,
}: ModalesCajaContainerProps) {
  return (
    <>
      <ModalCatalogoCategorias
        abierto={m.modalCategorias}
        alCerrar={() => m.setModalCategorias(false)}
        catalogo={catalogo}
        categoriaSeleccionada={categoriaSel}
        simboloMoneda={simboloMoneda}
        onAgregarProducto={onAgregarProducto}
        onCambiarCategoria={onCambiarCategoria}
        categorias={categorias}
      />
      <ModalCargarCotizacion
        abierto={m.modalCotizaciones}
        alCerrar={() => m.setModalCotizaciones(false)}
        cotizacionesDisponibles={cotizaciones}
        catalogo={catalogo}
        onImportarCotizacion={onImportarCotizacion}
        simboloMoneda={simboloMoneda}
      />
      <ModalCobro
        abierto={m.modalCobro}
        alCerrar={() => m.setModalCobro(false)}
        total={total}
        simboloMoneda={simboloMoneda}
        clientes={clientes}
        clienteSeleccionado={cliente}
        clienteIdSeleccionado={clienteId}
        onCambiarCliente={onCambiarCliente}
        onConfirmarCobro={onConfirmarCobro}
        enviando={enviando}
      />
      <ModalTicketExitoso
        abierto={m.modalTicket}
        alCerrar={() => m.setModalTicket(false)}
        ticketData={ticketExitoso}
        simboloMoneda={simboloMoneda}
        onImprimirTermico={() => imprimirTicketTermico(ticketExitoso, config)}
        onCompartirWhatsApp={(tel) => compartirWhatsApp(ticketExitoso, config, tel)}
        telefonoWhatsApp={m.telefonoWhatsApp}
        onCambiarTelefono={m.setTelefonoWhatsApp}
        onSiguienteVenta={onSiguienteVenta}
      />
      <ModalesTurnoCaja
        modalTurnoAbierto={m.modalTurno}
        onCerrarTurnoModal={() => m.setModalTurno(false)}
        modalMovimientoAbierto={m.modalMovimiento}
        onCerrarMovimientoModal={() => m.setModalMovimiento(false)}
        modalCierreAbierto={m.modalCierre}
        onCerrarCierreModal={() => m.setModalCierre(false)}
        turno={turno}
        efectivoContado={m.efectivoContado}
        onCambiarEfectivoContado={m.setEfectivoContado}
        notasCierre={m.notasCierre}
        onCambiarNotasCierre={m.setNotasCierre}
        efectivoEsperado={efectivoEsperado}
        diferenciaArqueo={difArqueo}
        simboloMoneda={simboloMoneda}
      />
    </>
  );
}
