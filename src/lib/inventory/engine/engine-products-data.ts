import { r2, r3 } from "@/lib/format";
import type { DB, DatosProducto } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";

export function asegurarCategoria(db: DB, nombre: string) {
  if (nombre && !db.categorias.includes(nombre)) db.categorias.push(nombre);
}

export function datosArticulo(input: DatosProducto) {
  const codigo = input.codigo.trim().toUpperCase();
  const codigoBarras = input.codigoBarras?.trim() || undefined;
  const nombre = input.nombre.trim();
  const categoria = (input.categoria || "").trim() || "Otros";
  const marca = input.marca?.trim() || "Genérica";
  const precio = r2(input.precio);
  const costo = r2(input.costo);
  if (!codigo || !nombre) throw new ReglaBodegaError("Código y descripción son obligatorios.");
  if (input.inventarioInicial !== undefined && input.inventarioInicial < 0) {
    throw new ReglaBodegaError("El inventario inicial no puede ser negativo.");
  }
  if (precio < 0 || costo < 0) throw new ReglaBodegaError("El precio y el costo no pueden ser negativos.");
  const stockMin = input.stockMinimo !== undefined ? r3(input.stockMinimo) : 0;
  if (stockMin < 0) throw new ReglaBodegaError("El stock mínimo no puede ser negativo.");
  return { codigo, codigoBarras, nombre, categoria, marca, precio, costo, stockMinimo: stockMin };
}
