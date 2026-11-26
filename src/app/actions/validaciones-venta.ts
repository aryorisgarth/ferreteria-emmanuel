import * as api from "@/lib/inventory/api";
import { ReglaBodegaError } from "@/lib/inventory/engine";
import type { RolUsuario } from "@/lib/auth";

export async function lineasVentaValidadas(formData: FormData, rol: RolUsuario = "CAJERO") {
  let items: Array<{
    productoId: string;
    cantidad: number;
    descuentoSolicitado?: number;
    observacion?: string;
    cotizacionItemId?: string;
    cotizacionId?: string;
    precioPersonalizado?: number;
  }>;
  try {
    const crudo = JSON.parse(String(formData.get("items") || "[]"));
    if (!Array.isArray(crudo)) throw new Error("formato");
    items = crudo;
  } catch {
    throw new ReglaBodegaError("Los renglones no tienen el formato esperado.");
  }

  // Si la venta está vinculada a una cotización en cabecera o renglones
  const cotizacionIdGlobal = String(formData.get("cotizacionId") || "").trim() || null;
  const cotizacionMap: Map<string, any> = new Map();
  if (cotizacionIdGlobal) {
    const cotDoc = await api.cotizacion(cotizacionIdGlobal);
    if (!cotDoc) {
      throw new ReglaBodegaError(`La cotización referenciada no existe.`);
    }
    if (cotDoc.esVersionActual === false) {
      throw new ReglaBodegaError(`La versión v${cotDoc.version || 1} de la cotización está sustituida y no es facturable.`);
    }
    const permitidos = ["AUTORIZADA", "PARCIALMENTE_FACTURADA", "EMITIDA", "ACEPTADA"];
    if (!permitidos.includes(cotDoc.estado)) {
      throw new ReglaBodegaError(`La cotización se encuentra en estado '${cotDoc.estado}'. Solo se permite facturar cotizaciones autorizadas.`);
    }
    for (const cItem of cotDoc.items || []) {
      cotizacionMap.set(cItem.id, cItem);
      cotizacionMap.set(cItem.productoId, cItem);
    }
  }

  const procesadas: Array<{
    productoId: string;
    cantidad: number;
    precio: number;
    observacion: string;
    cotizacionItemId?: string;
    descuento?: number;
    exentoIva?: boolean;
  }> = [];

  for (const item of items) {
    const productoId = String(item.productoId || "").trim();
    const cantidad = Number(item.cantidad);
    const observacion = String(item.observacion || "").trim();
    if (!productoId || !(cantidad > 0)) continue;

    // Verificar si el renglón proviene de la cotización autorizada
    const itemCot = item.cotizacionItemId ? cotizacionMap.get(item.cotizacionItemId) : cotizacionMap.get(productoId);
    if (itemCot) {
      // PRESERVAR EXACTAMENTE EL PRECIO AUTORIZADO DE LA COTIZACIÓN
      const precioCotizado = Number(itemCot.precio || 0);
      const pend = Number(itemCot.cantidadPendiente !== undefined ? itemCot.cantidadPendiente : itemCot.cantidad);
      if (cantidad > pend + 0.0001) {
        throw new ReglaBodegaError(
          `La cantidad solicitada (${cantidad}) supera el saldo pendiente (${pend}) de la cotización autorizada.`
        );
      }

      procesadas.push({
        productoId,
        cantidad,
        precio: precioCotizado,
        observacion: observacion || `Cotización autorizada`,
        cotizacionItemId: itemCot.id,
        descuento: Number(itemCot.descuento || 0),
        exentoIva: Boolean(itemCot.exentoIva),
      });
      continue;
    }

    // Venta directa / mostrador: Obtener precio oficial desde catálogo y validar límites de rol
    const prodOficial = await api.producto(productoId);
    if (!prodOficial || !prodOficial.activo) {
      throw new ReglaBodegaError(`El producto seleccionado no está disponible o fue dado de baja.`);
    }

    const precioCatalogo = Number(prodOficial.precio || 0);
    const descuentoPct = Number(item.descuentoSolicitado || 0);

    if (descuentoPct < 0 || descuentoPct > 100) {
      throw new ReglaBodegaError(`Porcentaje de descuento inválido para "${prodOficial.nombre}".`);
    }

    // Regla de autorización por Rol: Cajero máximo 3%, Administrador autorizado
    if (descuentoPct > 0) {
      if (rol !== "ADMINISTRADOR" && descuentoPct > 3.01) {
        throw new ReglaBodegaError(
          `Descuento del ${descuentoPct.toFixed(1)}% no autorizado para "${prodOficial.nombre}". El límite máximo para su rol es 3%. Requiere autorización de Administrador.`
        );
      }
    }

    const precioFinal = Number((precioCatalogo * (1 - descuentoPct / 100)).toFixed(2));

    procesadas.push({
      productoId,
      cantidad,
      precio: precioFinal,
      observacion,
    });
  }

  if (procesadas.length === 0) {
    throw new ReglaBodegaError("Debe incluir al menos un artículo con cantidad válida.");
  }

  return procesadas;
}
