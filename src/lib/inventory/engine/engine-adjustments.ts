import type { DB, AjusteInventario, TipoAjusteInventario } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import { exigirProducto, siguiente, conStock, movimientoNuevo } from "./engine-helpers";
import { r2, r3 } from "@/lib/format";

export interface ParametrosAjuste {
  productoId: string;
  tipo: TipoAjusteInventario;
  cantidad: number;
  motivo: string;
  fecha: string;
  usuario: string;
  signo?: 1 | -1;
  costoReferencia?: number;
  conteoId?: string | null;
}

export function crearAjuste(db: DB, input: ParametrosAjuste): AjusteInventario {
  const producto = exigirProducto(db, input.productoId);
  const cantidad = r3(input.cantidad);
  if (cantidad <= 0) {
    throw new ReglaBodegaError("La cantidad del ajuste debe ser mayor a cero.");
  }
  const motivo = input.motivo.trim();
  if (!motivo) {
    throw new ReglaBodegaError("El motivo o justificación del ajuste es obligatorio.");
  }

  // Determinar signo según tipo
  let signo: 1 | -1 = 1;
  if (input.tipo === "SOBRANTE") {
    signo = 1;
  } else if (input.tipo === "FALTANTE" || input.tipo === "DANO" || input.tipo === "MERMA") {
    signo = -1;
  } else if (input.tipo === "CORRECCION") {
    signo = input.signo ?? (input.cantidad >= 0 ? 1 : -1);
  }

  // Política de Costeo / Valuación
  let costoUnitario = r2(producto.costo);
  if (signo === 1) {
    if (costoUnitario <= 0) {
      if (!input.costoReferencia || input.costoReferencia <= 0) {
        throw new ReglaBodegaError(
          "Para registrar un incremento en un artículo sin costo, debe ingresar un costo de referencia válido mayor a cero."
        );
      }
      costoUnitario = r2(input.costoReferencia);
      producto.costo = costoUnitario;
    }
  } else {
    if (costoUnitario < 0) costoUnitario = 0;
  }

  const valorTotal = r2(cantidad * costoUnitario);
  const stockPrevio = r3(producto.stockActual);
  const stockNuevo = r3(stockPrevio + signo * cantidad);
  const numero = siguiente(db, "ajuste", input.fecha);

  const ajuste: AjusteInventario = {
    id: crypto.randomUUID(),
    numero,
    productoId: producto.id,
    tipo: input.tipo,
    cantidad,
    signo,
    stockPrevio,
    stockNuevo,
    costoUnitario,
    valorTotal,
    motivo,
    fecha: input.fecha,
    usuario: input.usuario.trim() || "Sistema",
    conteoId: input.conteoId ?? null,
    createdAt: new Date().toISOString(),
  };

  if (!db.ajustesInventario) db.ajustesInventario = [];
  db.ajustesInventario.push(ajuste);

  conStock(db, [producto.id], () => {
    const mov = movimientoNuevo(db, {
      tipo: "AJUSTE",
      fecha: input.fecha,
      productoId: producto.id,
      cantidad: r3(signo * cantidad),
      destinatario: `Ajuste (${input.tipo}): ${motivo}`,
      oficinaId: null,
      actaId: null,
      actaItemId: null,
      solicitudId: null,
      solicitudItemId: null,
      numeroReferencia: ajuste.numero,
      concepto: `Ajuste de inventario [${input.tipo}] - Folio: ${ajuste.numero}. Motivo: ${motivo}`,
      usuario: input.usuario.trim() || "Sistema",
      esAuditoria: false,
      origen: "AJUSTE",
      idempotencyKey: `AJUSTE:${ajuste.id}`,
    });
    db.movimientos.push(mov);
  });

  ajuste.stockNuevo = r3(producto.stockActual);
  return ajuste;
}

export function historialAjustes(db: DB): AjusteInventario[] {
  return [...(db.ajustesInventario ?? [])].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero)
  );
}
