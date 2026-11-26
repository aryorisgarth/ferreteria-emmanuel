import type { DB, Producto } from "@/lib/types";
import {
  CATEGORIAS_SEED,
  OFICINAS_SEED,
  PRODUCTOS_SEED,
  idProducto,
} from "./seed/seed-products-data";
import { movimientosSeed } from "./seed/seed-movements";
import { actasSeed, solicitudesSeed } from "./seed/seed-documents";

export { idProducto };

export function semillaCruda(): DB {
  const productos: Producto[] = PRODUCTOS_SEED.map(
    ([codigo, nombre, unidadMedida, inventarioInicial]) => ({
      id: idProducto(codigo),
      codigo,
      nombre,
      unidadMedida,
      inventarioInicial,
      stockActual: inventarioInicial,
      precio: 0,
      costo: 0,
      categoria: "Ferretería",
      stockMinimo: 0,
      activo: true,
    })
  );

  const oficinas = [...OFICINAS_SEED];
  const movimientos = movimientosSeed(productos);
  const solicitudes = solicitudesSeed();
  const actas = actasSeed();

  return {
    productos,
    oficinas,
    cotizaciones: [],
    facturas: [],
    clientes: [],
    proveedores: [],
    compras: [],
    gastos: [],
    categorias: [...CATEGORIAS_SEED],
    folios: { solicitud: 3, acta: 4, excel: 1, cotizacion: 0, factura: 0, compra: 0 },
    solicitudes,
    actas,
    movimientos,
  };
}
