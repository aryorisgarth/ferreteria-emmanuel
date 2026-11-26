import { dinero, numero } from "@/lib/format";
import type { ConfiguracionSistema } from "@/lib/config";

export function reproducirBeep(tipo: "ok" | "error" = "ok") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const freq = tipo === "ok" ? 1600 : 280;
    const dur = tipo === "ok" ? 0.09 : 0.18;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(tipo === "ok" ? 0.12 : 0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {}
}

export function imprimirTicketTermico(facturaObj: any, config: ConfiguracionSistema) {
  const { factura, items, subtotal: sub, isv, total: tot, vuelto: vuel, recibido: rec } = facturaObj;
  const fechaHora = new Date().toLocaleString("es-NI");
  const simboloMoneda = config?.moneda?.simbolo || "C$";
  const porcentajeImpuesto = config?.impuesto?.porcentaje ?? 15;
  const nombreImpuesto = config?.impuesto?.nombre || "I.V.A.";

  // Detección de ancho según preferencia local (58mm u 80mm)
  let anchoPapel = "80mm";
  let tamFuente = "12px";
  if (typeof window !== "undefined") {
    try {
      const prefs = JSON.parse(localStorage.getItem("ferreteria_hardware_prefs") || "{}");
      if (prefs.anchoPapel === "58mm" || prefs.tipoImpresora === "termica-58") {
        anchoPapel = "58mm";
        tamFuente = "10px";
      }
    } catch {
      // Valor por defecto 80mm
    }
  }

  const ventana = window.open("", "_blank", "width=380,height=650");
  if (!ventana) return;

  const itemsHtml = (items || [])
    .map(
      (it: any) => `
      <tr>
        <td style="padding: 2px 0;">${it.nombre}<br/><span style="font-size:${anchoPapel === "58mm" ? "8px" : "10px"};color:#555;">${it.codigo} · ${numero(it.cantidad)} x ${simboloMoneda} ${numero(it.precio)}</span></td>
        <td style="text-align: right; vertical-align: bottom; font-weight: bold; white-space: nowrap;">${simboloMoneda} ${numero(it.importe)}</td>
      </tr>`,
    )
    .join("");

  ventana.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ticket ${factura?.numero || ""}</title>
<style>
  @page { size: ${anchoPapel} auto; margin: 2mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: ${tamFuente}; margin: 0; padding: 2px; color: #000; -webkit-print-color-adjust: exact; }
  .c { text-align: center; } .r { text-align: right; }
  .sep { border-top: 1px dashed #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; font-size: inherit; }
</style></head><body>
  <div class="c">
    <strong style="font-size: 1.15em;">${config.empresa.nombre}</strong><br/>
    <span>${config.empresa.lema}</span><br/>
    <span>RUC: ${config.empresa.ruc}</span><br/>
    <span>${config.empresa.direccion}</span><br/>
    <span>Tel: ${config.empresa.telefono}</span>
  </div>
  <div class="sep"></div>
  <div><strong>NO. COMPROBANTE:</strong> ${factura?.numero || ""}</div>
  <div><strong>FECHA:</strong> ${fechaHora}</div>
  <div><strong>CLIENTE:</strong> ${factura?.cliente || "Público general"}</div>
  <div><strong>CAJERO:</strong> ${factura?.creadoPor || "Cajero"}</div>
  <div><strong>PAGO:</strong> ${factura?.formaPago || "EFECTIVO"}</div>
  <div class="sep"></div>
  <table>
    <thead><tr style="border-bottom: 1px solid #000;"><th style="text-align: left;">DESCRIPCIÓN</th><th style="text-align: right;">TOTAL</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <div class="sep"></div>
  <table>
    <tr><td>SUBTOTAL:</td><td class="r">${simboloMoneda} ${numero(sub)}</td></tr>
    <tr><td>${nombreImpuesto} (${porcentajeImpuesto}%):</td><td class="r">${simboloMoneda} ${numero(isv)}</td></tr>
    <tr style="font-weight: bold; font-size: 1.1em;"><td>TOTAL:</td><td class="r">${simboloMoneda} ${numero(tot)}</td></tr>
    ${rec > 0 ? `<tr><td>RECIBIDO:</td><td class="r">${simboloMoneda} ${numero(rec)}</td></tr>` : ""}
    ${vuel > 0 ? `<tr><td>CAMBIO:</td><td class="r">${simboloMoneda} ${numero(vuel)}</td></tr>` : ""}
  </table>
  <div class="sep"></div>
  <div class="c" style="font-size: 0.85em; margin-top: 6px;">${config.empresa.pieFactura || "¡Gracias por su compra!"}</div>
</body></html>`);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 250);
}

export function compartirWhatsApp(facturaObj: any, config: ConfiguracionSistema, telDirecto?: string) {
  const { factura, total: tot, items } = facturaObj;
  const simboloMoneda = config?.moneda?.simbolo || "C$";
  const tel = telDirecto || "";
  let numLimpio = tel.replace(/\D/g, "");
  if (numLimpio.length === 8) numLimpio = `505${numLimpio}`;

  const lineasTicket = (items || [])
    .map((i: any) => `• ${numero(i.cantidad)}x ${i.nombre}: ${simboloMoneda} ${numero(i.importe)}`)
    .join("\n");

  const mensajeWhatsApp =
    `🏪 *${config.empresa.nombre.toUpperCase()}*\n` +
    `📋 *Comprobante de Venta:* ${factura?.numero || ""}\n` +
    `👤 *Cliente:* ${factura?.cliente || "Público general"}\n` +
    `💳 *Forma de Pago:* ${factura?.formaPago || "EFECTIVO"}\n` +
    `--------------------------------\n` +
    `*DETALLE DE MATERIALES:*\n` +
    `${lineasTicket}\n` +
    `--------------------------------\n` +
    `💰 *TOTAL PAGADO:* ${simboloMoneda} ${numero(tot)}\n` +
    (facturaObj.vuelto > 0 ? `💵 *Cambio Entregado:* ${simboloMoneda} ${numero(facturaObj.vuelto)}\n` : "") +
    `--------------------------------\n` +
    `_${config.empresa.pieFactura || "¡Gracias por su compra!"}_`;

  const urlWa = numLimpio
    ? `https://wa.me/${numLimpio}?text=${encodeURIComponent(mensajeWhatsApp)}`
    : `https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp)}`;

  window.open(urlWa, "_blank");
}
