import { dinero } from "@/lib/format";
import type { ConfiguracionSistema } from "@/lib/config";

export interface DatosReciboAbono {
  reciboNumero: string;
  facturaNumero: string;
  cliente: string;
  fecha: string;
  hora: string;
  montoAbonado: number;
  saldoAnterior: number;
  saldoRestante: number;
  medioCobro: string;
  referencia?: string;
  usuario: string;
  notas?: string;
}

export function imprimirReciboAbonoCaja(
  datos: DatosReciboAbono,
  config?: ConfiguracionSistema
) {
  if (typeof window === "undefined") return;
  const ventana = window.open("", "_blank", "width=600,height=750");
  if (!ventana) return;

  const emp = config?.empresa || {
    nombre: "FERRETERÍA EMMANUEL S.A.",
    ruc: "J0310000000000",
    direccion: "Esquina Opuesta al Mercado Central",
    telefono: "2311-0000",
  };
  const sim = config?.moneda?.simbolo || "C$";
  const liquidada = datos.saldoRestante <= 0;

  ventana.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recibo ${datos.reciboNumero}</title>
  <style>
    @page { size: auto; margin: 12mm; }
    body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; margin: 0; color: #0f172a; font-size: 11pt; }
    .recibo-card { border: 2px solid #1e3a8a; border-radius: 6px; padding: 18px 24px; }
    .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { color: #1e3a8a; font-size: 14pt; font-weight: bold; margin: 0; text-transform: uppercase; }
    .folio { font-family: Consolas, monospace; font-size: 13pt; font-weight: bold; color: #dc2626; text-align: right; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px 14px; margin: 10px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10pt; }
    .monto-box { background: #eff6ff; border: 1.5px solid #3b82f6; text-align: center; padding: 12px; border-radius: 4px; margin: 14px 0; }
    .monto-val { font-size: 18pt; font-weight: 800; color: #1d4ed8; font-family: Consolas, monospace; }
    .firmas { display: flex; justify-content: space-between; margin-top: 45px; text-align: center; }
    .linea-firma { border-top: 1px solid #64748b; width: 220px; padding-top: 4px; font-size: 9.5pt; font-weight: bold; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body onload="window.print()">
  <div class="recibo-card">
    <div class="header">
      <div>
        <h2 class="title">${emp.nombre}</h2>
        <div style="font-size: 9pt; color: #475569; margin-top: 3px;">
          RUC: ${emp.ruc} &nbsp;|&nbsp; Tel: ${emp.telefono}<br/>
          ${emp.direccion}
        </div>
      </div>
      <div>
        <div style="font-size: 9pt; text-transform: uppercase; color: #64748b; font-weight: bold;">Recibo Oficial de Caja</div>
        <div class="folio">${datos.reciboNumero}</div>
        <div style="font-size: 9pt; color: #475569;">Fecha: ${datos.fecha} ${datos.hora}</div>
      </div>
    </div>

    <div class="box">
      <div class="row"><strong>Recibimos de:</strong> <span>${datos.cliente}</span></div>
      <div class="row"><strong>Factura Afectada:</strong> <span style="font-family: Consolas, monospace; font-weight: bold;">${datos.facturaNumero}</span></div>
      <div class="row"><strong>Método de Cobro:</strong> <span>${datos.medioCobro} ${datos.referencia ? '(' + datos.referencia + ')' : ''}</span></div>
      <div class="row"><strong>Cajero / Receptor:</strong> <span>${datos.usuario}</span></div>
    </div>

    <div class="monto-box">
      <div style="font-size: 10pt; font-weight: bold; color: #1e40af; text-transform: uppercase;">Monto Abonado a la Cuenta</div>
      <div class="monto-val">${dinero(datos.montoAbonado, sim)}</div>
    </div>

    <div class="box">
      <div class="row"><span>Saldo Anterior de la Factura:</span> <span>${dinero(datos.saldoAnterior, sim)}</span></div>
      <div class="row" style="color: #15803d; font-weight: bold;"><span>Abono Aplicado:</span> <span>- ${dinero(datos.montoAbonado, sim)}</span></div>
      <div class="row" style="border-top: 1px solid #cbd5e1; padding-top: 5px; font-weight: bold; font-size: 11pt;">
        <span>Nuevo Saldo Pendiente:</span>
        <span style="color: ${liquidada ? '#15803d' : '#b91c1c'};">${liquidada ? '0.00 (TOTALMENTE LIQUIDADA)' : dinero(datos.saldoRestante, sim)}</span>
      </div>
    </div>

    ${datos.notas ? `<p style="font-size: 9pt; color: #64748b; font-style: italic;">Notas: ${datos.notas}</p>` : ''}

    <div class="firmas">
      <div>
        <div class="linea-firma">${datos.usuario}</div>
        <div style="font-size: 8.5pt; color: #64748b;">Cajero / Firma y Sello</div>
      </div>
      <div>
        <div class="linea-firma">${datos.cliente}</div>
        <div style="font-size: 8.5pt; color: #64748b;">Cliente / Conforme Recibido</div>
      </div>
    </div>
  </div>
</body>
</html>`);
  ventana.document.close();
}
