import * as api from "@/lib/inventory/api";
import { ReglaBodegaError } from "@/lib/inventory/engine";

export async function lineasCompraValidadas(formData: FormData) {
  let items: Array<{ productoId: string; cantidad: number; costoUnitario?: number; precio?: number; observacion?: string }>;
  try {
    const crudo = JSON.parse(String(formData.get("items") || "[]"));
    if (!Array.isArray(crudo)) throw new Error("formato");
    items = crudo;
  } catch {
    throw new ReglaBodegaError("Los renglones de compra no tienen el formato esperado.");
  }

  const procesadas: Array<{ productoId: string; cantidad: number; precio: number; observacion: string }> = [];
  for (const item of items) {
    const productoId = String(item.productoId || "").trim();
    const cantidad = Number(item.cantidad);
    const costo = Number(item.costoUnitario ?? item.precio ?? 0);
    const observacion = String(item.observacion || "").trim();

    if (!productoId || !(cantidad > 0)) continue;

    const prodOficial = await api.producto(productoId);
    if (!prodOficial) {
      throw new ReglaBodegaError(`El artículo de compra seleccionado no existe en el catálogo.`);
    }

    if (costo < 0) {
      throw new ReglaBodegaError(`El costo de adquisición no puede ser negativo.`);
    }

    procesadas.push({
      productoId,
      cantidad,
      precio: costo,
      observacion,
    });
  }

  if (procesadas.length === 0) {
    throw new ReglaBodegaError("Debe incluir al menos un artículo en la compra.");
  }

  return procesadas;
}
