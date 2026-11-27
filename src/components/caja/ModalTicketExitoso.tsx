"use client";

import { useEffect } from "react";
import { Printer, Share2, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { dinero, numero } from "@/lib/format";
import { reproducirChimeExito } from "./utilidades-impresion";

interface ModalTicketExitosoProps {
  abierto: boolean;
  alCerrar: () => void;
  ticketData: any;
  simboloMoneda: string;
  onImprimirTermico: () => void;
  onCompartirWhatsApp: (telefono?: string) => void;
  telefonoWhatsApp: string;
  onCambiarTelefono: (tel: string) => void;
  onSiguienteVenta: () => void;
}

export function ModalTicketExitoso({
  abierto,
  alCerrar,
  ticketData,
  simboloMoneda,
  onImprimirTermico,
  onCompartirWhatsApp,
  telefonoWhatsApp,
  onCambiarTelefono,
  onSiguienteVenta,
}: ModalTicketExitosoProps) {
  useEffect(() => {
    if (abierto) {
      reproducirChimeExito();
    }
  }, [abierto]);

  if (!ticketData) return null;

  const { factura, items, total, vuelto } = ticketData;

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="¡Cobro Procesado con Éxito!"
      subtitulo={`Comprobante emitido: ${factura?.numero || ""}`}
      anchoMax="lg"
    >
      <div className="space-y-4">
        {/* Resumen del Comprobante */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center space-y-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-1">
            <CheckCircle2 size={22} />
          </div>
          <p className="font-mono text-xs font-bold text-slate-800">{factura?.numero}</p>
          <p className="text-xs text-slate-600">Cliente: <strong>{factura?.cliente || "Público general"}</strong></p>
          <p className="text-base font-black text-slate-900 pt-1">
            Total Pagado: {dinero(total, simboloMoneda)}
          </p>
          {vuelto > 0 && (
            <p className="text-xs font-bold text-emerald-700">
              Cambio Entregado: {dinero(vuelto, simboloMoneda)}
            </p>
          )}
        </div>

        {/* WhatsApp rápido */}
        <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-2">
          <label className="block text-xs font-bold text-emerald-900">
            Enviar comprobante digital por WhatsApp:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={telefonoWhatsApp}
              onChange={(e) => onCambiarTelefono(e.target.value)}
              placeholder="Número de WhatsApp (ej. 88889999)"
              className="h-8 flex-1 rounded border border-emerald-300 bg-white px-2.5 text-xs outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => onCompartirWhatsApp(telefonoWhatsApp)}
              className="btn btn-verde h-8 px-3 text-xs font-bold gap-1 shadow-2xs"
            >
              <Share2 size={13} />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Botones de acción final */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onImprimirTermico}
              className="btn btn-azul flex-1 sm:flex-none h-9 px-4 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <Printer size={15} />
              <span>Imprimir Ticket</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  try {
                    const p = JSON.parse(localStorage.getItem("ferreteria_hardware_prefs") || "{}");
                    p.anchoPapel = p.anchoPapel === "58mm" ? "80mm" : "58mm";
                    localStorage.setItem("ferreteria_hardware_prefs", JSON.stringify(p));
                  } catch {}
                  onImprimirTermico();
                }
              }}
              className="btn btn-linea h-9 px-2 text-xs font-mono font-bold text-slate-700"
              title="Alternar ancho 80mm / 58mm y reimprimir"
            >
              80/58mm
            </button>
          </div>

          <button
            type="button"
            onClick={onSiguienteVenta}
            className="btn btn-amarillo w-full sm:w-auto h-9 px-5 text-xs font-black uppercase tracking-wider shadow-xs"
          >
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
