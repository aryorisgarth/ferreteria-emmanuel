"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { Search, X, ScanLine } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BarraAccionesCaja } from "./BarraAccionesCaja";
import { BarraCategorias } from "./BarraCategorias";
import { TablaArticulosVenta } from "./TablaArticulosVenta";
import { TicketVenta } from "./TicketVenta";
import { FormCobroHidden } from "./FormCobroHidden";
import { ModalesCajaContainer } from "./ModalesCajaContainer";
import { ModalTicketsEspera } from "./ModalTicketsEspera";
import { useCarritoPos } from "./useCarritoPos";
import { useTicketsEnEspera } from "./useTicketsEnEspera";
import { useModalesCaja } from "./useModalesCaja";
import { useAtajosPos } from "./useAtajosPos";
import { reproducirBeep } from "./utilidades-impresion";
import type { CajaProps } from "./tipos";

export function CajaPos({ catalogo, clientes, turno, config, ticketExitoso, cotizaciones = [] }: CajaProps) {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("TODAS");
  const [cliente, setCliente] = useState("Público general");
  const [clienteId, setClienteId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [datosCobroForm, setDatosCobroForm] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formCobroHiddenRef = useRef<HTMLFormElement>(null);

  const factorImpuesto = (config?.impuesto?.porcentaje ?? 15) / 100;
  const { carrito, setCarrito, subtotal, iva, total, cotizacionActiva, agregar, cambiarCantidad, fijarCantidad, eliminar, importarCotizacion } = useCarritoPos(factorImpuesto);
  const { tickets: ticketsEspera, pausarTicket, retomarTicket, descartarTicket } = useTicketsEnEspera();
  const [modalTicketsEspera, setModalTicketsEspera] = useState(false);
  const m = useModalesCaja(ticketExitoso);

  const categorias = useMemo(() => {
    const s = new Set<string>();
    catalogo.forEach((p) => { if (p.categoria) s.add(p.categoria); });
    return Array.from(s);
  }, [catalogo]);

  const escanear = useCallback((raw: string) => {
    let entrada = raw.trim();
    if (!entrada) return;
    let mult = 1;
    const match = entrada.match(/^(\d+(?:\.\d+)?)\s*\*\s*(.+)$/);
    if (match && parseFloat(match[1]) > 0) { mult = parseFloat(match[1]); entrada = match[2].trim(); }
    const cod = entrada.toLowerCase();
    const hit = catalogo.find((p) => p.activo && (p.codigo.toLowerCase() === cod || (p.codigoBarras && p.codigoBarras.toLowerCase() === cod)));
    if (hit) { agregar(hit, mult); setQ(""); return; }
    const matches = catalogo.filter((p) => p.activo && (p.codigo.toLowerCase().includes(cod) || p.nombre.toLowerCase().includes(cod)));
    if (matches.length === 1 && matches[0]) { agregar(matches[0], mult); setQ(""); return; }
    reproducirBeep("error");
    toast.error(`No se encontró el producto: "${raw}"`, "No Encontrado");
  }, [catalogo, agregar, toast]);

  useAtajosPos({
    onBuscarFocus: () => { searchInputRef.current?.focus(); searchInputRef.current?.select(); },
    onAbrirCotizaciones: () => m.setModalCotizaciones(true),
    onCobrar: () => {
      if (carrito.length === 0) return toast.aviso("Agrega artículos antes de cobrar.", "Ticket Vacío");
      if (!turno) return toast.aviso("Debe abrir turno de caja para cobrar.", "Caja Cerrada");
      m.setModalCobro(true);
    },
    onEscape: () => { m.setModalCategorias(false); m.setModalCobro(false); setQ(""); },
    onEscaneo: escanear,
  });

  const confirmarCobro = (datos: any) => {
    setEnviando(true);
    setDatosCobroForm(datos);
    setTimeout(() => formCobroHiddenRef.current?.requestSubmit(), 50);
  };

  const efectivoEsperado = (turno?.montoInicial || 0) + (turno?.totalVentasEfectivo || 0) + (turno?.totalIngresosExtra || 0) - (turno?.totalEgresos || 0);
  const difArqueo = typeof m.efectivoContado === "number" ? m.efectivoContado - efectivoEsperado : null;

  return (
    <div className="space-y-2.5">
      <BarraAccionesCaja
        turno={turno}
        onAbrirCotizaciones={() => m.setModalCotizaciones(true)}
        onAbrirMovimiento={() => m.setModalMovimiento(true)}
        onAbrirCierre={m.abrirCierre}
        onAbrirTurno={() => m.setModalTurno(true)}
        onPausarVenta={() => {
          if (carrito.length === 0) return toast.aviso("Agrega artículos para pausar.", "Ticket Vacío");
          if (pausarTicket(carrito, total)) { setCarrito([]); toast.exito("Ticket en espera."); }
        }}
        onAbrirTicketsEspera={() => setModalTicketsEspera(true)}
        ticketsEsperaCount={ticketsEspera.length}
        hayItemsCarrito={carrito.length > 0}
      />

      <div className="grid gap-3 lg:grid-cols-[1.35fr_1.05fr] xl:grid-cols-[1.4fr_1fr] w-full items-start">
        <div className="space-y-2">
          <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input ref={searchInputRef} type="text" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); escanear(q); } }} placeholder="[F2] Buscar por nombre, código o escáner..." className="h-8 w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-16 text-xs font-medium outline-none focus:border-brand-yellow focus:bg-white" autoFocus />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {q && <button type="button" onClick={() => setQ("")} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>}
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200"><ScanLine size={10} /> Escáner</span>
              </div>
            </div>
            <BarraCategorias categorias={categorias} categoriaActiva={categoriaSel} onSeleccionarCategoria={(cat) => { setCategoriaSel(cat); m.setModalCategorias(true); }} />
          </div>

          <TablaArticulosVenta items={carrito} simboloMoneda={config?.moneda?.simbolo || "C$"} onCambiarCantidad={cambiarCantidad} onFijarCantidad={fijarCantidad} onEliminar={eliminar} onLimpiarCarrito={() => setCarrito([])} onAbrirCatalogo={() => m.setModalCategorias(true)} />
        </div>

        <div>
          <TicketVenta
            items={carrito} subtotal={subtotal} iva={iva} total={total} config={config} turnoUsuario={turno?.usuario || "Cajero"} clienteNombre={cliente} cotizacionActiva={cotizacionActiva}
            onCobrar={() => {
              if (carrito.length === 0) return toast.aviso("Agrega artículos al ticket antes de cobrar.", "Ticket Vacío");
              if (!turno) return toast.aviso("Debe abrir un turno de caja para cobrar.", "Caja Cerrada");
              m.setModalCobro(true);
            }}
            disabled={!turno}
          />
        </div>
      </div>

      <FormCobroHidden formRef={formCobroHiddenRef} cliente={cliente} clienteId={clienteId} carrito={carrito} cotizacionId={cotizacionActiva?.cotizacionId} datosCobro={datosCobroForm} />

      <ModalesCajaContainer
        m={m} catalogo={catalogo} categoriaSel={categoriaSel} onAgregarProducto={agregar} onCambiarCategoria={setCategoriaSel} categorias={categorias}
        cotizaciones={cotizaciones} onImportarCotizacion={(d) => { setCliente(d.clienteNombre); if (d.clienteId) setClienteId(d.clienteId); importarCotizacion(d); }}
        total={total} simboloMoneda={config?.moneda?.simbolo || "C$"} clientes={clientes} cliente={cliente} clienteId={clienteId}
        onCambiarCliente={(nom, id) => { setCliente(nom); setClienteId(id); }} onConfirmarCobro={confirmarCobro} enviando={enviando}
        ticketExitoso={ticketExitoso} config={config} onSiguienteVenta={() => { setCarrito([]); setCliente("Público general"); setClienteId(""); m.setModalTicket(false); }}
        turno={turno} efectivoEsperado={efectivoEsperado} difArqueo={difArqueo}
      />

      <ModalTicketsEspera
        abierto={modalTicketsEspera} alCerrar={() => setModalTicketsEspera(false)} tickets={ticketsEspera}
        simboloMoneda={config?.moneda?.simbolo || "C$"}
        onRetomar={(id) => { const r = retomarTicket(id); if (r) { setCarrito(r); toast.exito("Ticket retomado."); } }}
        onDescartar={descartarTicket}
      />
    </div>
  );
}
