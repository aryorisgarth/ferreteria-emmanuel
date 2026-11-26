import { r3 } from "@/lib/format";
import type { DB, FilaExcel, TotalDia } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import { conStock, exigirProducto, movimientoNuevo } from "./engine-helpers";
import { recalcularProducto } from "./engine-products";

export function importarFilas(db: DB, filas: FilaExcel[], usuario: string) {
  if (!filas.length) throw new ReglaBodegaError("El archivo no trae renglones.");
  const preparados = filas.map((fila, indice) => {
    const producto = db.productos.find((p) => p.codigo === fila.codigo.trim().toUpperCase());
    if (!producto) {
      throw new ReglaBodegaError(`Fila ${indice + 1}: el código ${fila.codigo} no está en el libro.`);
    }
    if (fila.tipo !== "ENTRADA" && fila.tipo !== "SALIDA") {
      throw new ReglaBodegaError(`Fila ${indice + 1}: el tipo debe ser ENTRADA o SALIDA.`);
    }
    if (fila.tipo === "ENTRADA") {
      throw new ReglaBodegaError(
        `Fila ${indice + 1}: Las entradas masivas sin valoración contable no están permitidas. Registre las adquisiciones formalmente en el módulo de Compras para proteger el CPP.`
      );
    }
    if (fila.cantidad <= 0) throw new ReglaBodegaError(`Fila ${indice + 1}: la cantidad debe ser mayor que cero.`);
    const destino = fila.destinatario?.trim() || "";
    if (fila.tipo === "SALIDA" && !destino) {
      throw new ReglaBodegaError(`Fila ${indice + 1}: la salida exige destinatario.`);
    }
    const oficina = db.oficinas.find((o) => o.nombre.toLowerCase() === destino.toLowerCase());
    return { fila, producto, destino, oficinaId: oficina?.id ?? null };
  });

  conStock(
    db,
    preparados.map((fila) => fila.producto.id),
    () => {
      for (const item of preparados) {
        db.folios.excel += 1;
        db.movimientos.push(
          movimientoNuevo(db, {
            productoId: item.producto.id,
            fecha: item.fila.fecha,
            tipo: item.fila.tipo,
            cantidad: item.fila.cantidad,
            destinatario: item.destino,
            oficinaId: item.oficinaId,
            actaId: null,
            actaItemId: null,
            solicitudId: null,
            solicitudItemId: null,
            numeroReferencia: `XLS-${String(db.folios.excel).padStart(5, "0")}`,
            concepto: item.fila.concepto?.trim() || "Importación Excel/CSV",
            usuario,
            esAuditoria: Boolean(item.fila.esAuditoria),
            origen: "EXCEL",
            idempotencyKey: null,
          }),
        );
      }
    },
    recalcularProducto
  );
  return preparados.length;
}

export function totalDelDia(db: DB, fecha: string): TotalDia[] {
  const grupos = new Map<string, TotalDia & { destinos: Set<string> }>();
  for (const mov of db.movimientos) {
    if (mov.tipo !== "SALIDA" || mov.fecha !== fecha) continue;
    const producto = exigirProducto(db, mov.productoId);
    const clave = `${producto.id}|${producto.unidadMedida}`;
    let grupo = grupos.get(clave);
    if (!grupo) {
      grupo = {
        productoId: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        unidadMedida: producto.unidadMedida,
        total: 0,
        destinatarios: [],
        destinos: new Set<string>(),
      };
      grupos.set(clave, grupo);
    }
    if (grupo.unidadMedida !== producto.unidadMedida) {
      throw new ReglaBodegaError("No se pueden consolidar unidades de medida distintas.");
    }
    grupo.total = r3(grupo.total + mov.salidas);
    if (mov.destinatario.trim()) grupo.destinos.add(mov.destinatario.trim());
  }
  return [...grupos.values()]
    .map(({ destinos, ...grupo }) => ({ ...grupo, destinatarios: [...destinos].sort() }))
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}
