import type { DB, ConteoFisico, ConteoFisicoItem, AjusteInventario, TipoAjusteInventario } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import { exigirProducto, siguiente } from "./engine-helpers";
import { crearAjuste } from "./engine-adjustments";
import { r3 } from "@/lib/format";

export interface ParametrosConteoFisico {
  fecha: string;
  notas: string;
  usuario: string;
  items: Array<{
    productoId: string;
    conteoFisico: number;
    observacion?: string;
  }>;
}

export function crearConteoFisico(db: DB, input: ParametrosConteoFisico): ConteoFisico {
  if (!input.items || input.items.length === 0) {
    throw new ReglaBodegaError("El conteo físico debe incluir al menos un artículo.");
  }

  const itemsConteo: ConteoFisicoItem[] = input.items.map((item) => {
    const prod = exigirProducto(db, item.productoId);
    const conteoFisico = r3(item.conteoFisico);
    if (conteoFisico < 0) {
      throw new ReglaBodegaError(`El conteo físico para ${prod.nombre} (${prod.codigo}) no puede ser negativo.`);
    }
    const stockSistema = r3(prod.stockActual);
    const diferencia = r3(conteoFisico - stockSistema);
    return {
      productoId: prod.id,
      stockSistema,
      conteoFisico,
      diferencia,
      observacion: item.observacion?.trim(),
    };
  });

  const numero = siguiente(db, "conteo", input.fecha);
  const conteo: ConteoFisico = {
    id: crypto.randomUUID(),
    numero,
    fecha: input.fecha,
    usuario: input.usuario.trim() || "Sistema",
    notas: input.notas.trim(),
    estado: "BORRADOR",
    items: itemsConteo,
    createdAt: new Date().toISOString(),
  };

  if (!db.conteosFisicos) db.conteosFisicos = [];
  db.conteosFisicos.push(conteo);
  return conteo;
}

export function aplicarConteoFisico(
  db: DB,
  conteoId: string,
  usuario: string
): { conteo: ConteoFisico; ajustesGenerados: AjusteInventario[] } {
  const conteo = (db.conteosFisicos ?? []).find((c) => c.id === conteoId);
  if (!conteo) {
    throw new ReglaBodegaError("Conteo físico no encontrado.");
  }
  if (conteo.estado === "APLICADO") {
    throw new ReglaBodegaError("Este conteo físico ya fue aplicado y no puede volver a ejecutarse.");
  }

  // VALIDACIÓN DE DESACTUALIZACIÓN (H-02)
  for (const item of conteo.items) {
    const prod = exigirProducto(db, item.productoId);
    const stockCambio = Math.abs(prod.stockActual - item.stockSistema) > 0.0005;
    const fechaConteoIso = conteo.createdAt || conteo.fecha;
    const hayMovimientosPosteriores = db.movimientos.some(
      (m) =>
        m.productoId === item.productoId &&
        (m.createdAt > fechaConteoIso || m.fecha > conteo.fecha)
    );

    if (stockCambio || hayMovimientosPosteriores) {
      throw new ReglaBodegaError(
        `El conteo físico ${conteo.numero} está desactualizado: Se detectaron movimientos o cambios de existencias posteriores a su levantamiento en el artículo ${prod.nombre} (${prod.codigo}). Stock al capturar: ${item.stockSistema}, stock actual en bodega: ${prod.stockActual}. Por integridad de inventario, el borrador original se mantiene intacto y requiere revisión antes de su aplicación.`
      );
    }
  }

  const ajustesGenerados: AjusteInventario[] = [];

  for (const item of conteo.items) {
    if (Math.abs(item.diferencia) > 0.0001) {
      const tipo: TipoAjusteInventario = item.diferencia > 0 ? "SOBRANTE" : "FALTANTE";
      const cantidad = Math.abs(item.diferencia);
      const motivo = `Ajuste derivado de Conteo Físico ${conteo.numero}${item.observacion ? `: ${item.observacion}` : ""}`;

      const ajuste = crearAjuste(db, {
        productoId: item.productoId,
        tipo,
        cantidad,
        motivo,
        fecha: conteo.fecha,
        usuario,
        conteoId: conteo.id,
      });
      ajustesGenerados.push(ajuste);
    }
  }

  conteo.estado = "APLICADO";
  return { conteo, ajustesGenerados };
}

export function historialConteos(db: DB): ConteoFisico[] {
  return [...(db.conteosFisicos ?? [])].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero)
  );
}

export function detalleConteo(db: DB, conteoId: string): ConteoFisico | null {
  return (db.conteosFisicos ?? []).find((c) => c.id === conteoId) ?? null;
}
