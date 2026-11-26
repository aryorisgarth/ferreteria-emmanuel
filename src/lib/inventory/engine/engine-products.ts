import { r3 } from "@/lib/format";
import { idProducto, semillaCruda } from "@/lib/inventory/seed";
import type { DB, DatosProducto, Producto, ProductoVista } from "@/lib/types";
import { ReglaBodegaError } from "./engine-core";
import { exigirProducto, ordenKardex } from "./engine-helpers";
import { asegurarCategoria, datosArticulo } from "./engine-products-data";

export function recalcularProducto(db: DB, productoId: string) {
  const producto = exigirProducto(db, productoId);
  const movs = db.movimientos
    .filter((m) => m.productoId === productoId)
    .sort(ordenKardex);

  let saldo = r3(producto.inventarioInicial);
  movs.forEach((m, indice) => {
    m.secuencia = indice + 1;
    m.unidadMedida = producto.unidadMedida;
    m.cantidad = r3(m.cantidad);

    if (m.tipo === "ENTRADA") {
      if (m.cantidad <= 0) throw new ReglaBodegaError("La entrada debe ser mayor que cero.");
      m.entradas = m.cantidad;
      m.salidas = 0;
      saldo = r3(saldo + m.cantidad);
    } else if (m.tipo === "SALIDA") {
      if (m.cantidad <= 0) throw new ReglaBodegaError("La salida debe ser mayor que cero.");
      if (!m.destinatario.trim()) {
        throw new ReglaBodegaError("Toda salida exige destinatario, persona u oficina.");
      }
      m.entradas = 0;
      m.salidas = m.cantidad;
      saldo = r3(saldo - m.cantidad);
    } else {
      m.entradas = m.cantidad > 0 ? m.cantidad : 0;
      m.salidas = m.cantidad < 0 ? r3(Math.abs(m.cantidad)) : 0;
      saldo = r3(saldo + m.cantidad);
    }

    if (saldo < -0.0005) {
      throw new ReglaBodegaError(
        `Stock insuficiente de ${producto.nombre} (${producto.codigo}). El saldo de la secuencia quedaría en ${saldo} ${producto.unidadMedida}.`,
      );
    }

    m.stockSaldo = saldo;
    if (m.esAuditoria && m.estadoAuditoria === "NORMAL") m.estadoAuditoria = "EN_AUDITORIA";
    if (!m.esAuditoria) m.estadoAuditoria = "NORMAL";
  });

  const entradas = r3(movs.reduce((suma, m) => suma + m.entradas, 0));
  const salidas = r3(movs.reduce((suma, m) => suma + m.salidas, 0));
  producto.stockActual = r3(producto.inventarioInicial + entradas - salidas);
}

export function libroDemo(): DB {
  const db = semillaCruda();
  for (const producto of db.productos) recalcularProducto(db, producto.id);
  return db;
}

export function vistaProductos(db: DB): ProductoVista[] {
  return db.productos
    .map((producto) => {
      const movs = db.movimientos.filter((m) => m.productoId === producto.id);
      const totalEntradas = r3(movs.reduce((suma, m) => suma + m.entradas, 0));
      const totalSalidas = r3(movs.reduce((suma, m) => suma + m.salidas, 0));
      return {
        ...producto,
        totalEntradas,
        totalSalidas,
        stockActual: r3(producto.inventarioInicial + totalEntradas - totalSalidas),
      };
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export function buscarProductos(db: DB, consulta: string) {
  const q = consulta.trim().toLowerCase();
  return vistaProductos(db).filter(
    (p) =>
      !q ||
      p.codigo.toLowerCase().includes(q) ||
      (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q)) ||
      p.nombre.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      (p.marca && p.marca.toLowerCase().includes(q)),
  );
}

export function altaProducto(db: DB, input: DatosProducto) {
  const datos = datosArticulo(input);
  if (db.productos.some((p) => p.codigo === datos.codigo)) {
    throw new ReglaBodegaError(`El código ${datos.codigo} ya existe.`);
  }
  asegurarCategoria(db, datos.categoria);
  const producto: Producto = {
    id: idProducto(datos.codigo) + "-" + crypto.randomUUID().slice(0, 8),
    codigo: datos.codigo,
    codigoBarras: datos.codigoBarras,
    nombre: datos.nombre,
    unidadMedida: input.unidadMedida,
    inventarioInicial: r3(input.inventarioInicial),
    stockActual: r3(input.inventarioInicial),
    precio: datos.precio,
    costo: datos.costo,
    categoria: datos.categoria,
    marca: datos.marca,
    stockMinimo: datos.stockMinimo,
    activo: true,
  };
  db.productos.push(producto);
  return producto;
}

export function editarProducto(db: DB, id: string, input: DatosProducto) {
  const producto = exigirProducto(db, id);
  const datos = datosArticulo(input);
  if (db.productos.some((p) => p.id !== id && p.codigo === datos.codigo)) {
    throw new ReglaBodegaError(`El código ${datos.codigo} ya existe.`);
  }
  const tieneMovs = db.movimientos.some((m) => m.productoId === id);
  if (tieneMovs && producto.unidadMedida !== input.unidadMedida) {
    throw new ReglaBodegaError("No se puede cambiar la unidad si el artículo ya tiene movimientos.");
  }
  asegurarCategoria(db, datos.categoria);
  producto.codigo = datos.codigo;
  producto.codigoBarras = datos.codigoBarras;
  producto.nombre = datos.nombre;
  producto.unidadMedida = input.unidadMedida;
  if (!tieneMovs) {
    producto.inventarioInicial = r3(input.inventarioInicial);
    producto.stockActual = r3(producto.inventarioInicial);
  }
  producto.precio = datos.precio;
  producto.costo = datos.costo;
  producto.categoria = datos.categoria;
  producto.marca = datos.marca;
  producto.stockMinimo = datos.stockMinimo;
  if (tieneMovs) recalcularProducto(db, id);
  else producto.stockActual = r3(producto.inventarioInicial);
  return producto;
}

export function eliminarProducto(db: DB, id: string) {
  exigirProducto(db, id);
  if (db.movimientos.some((m) => m.productoId === id)) {
    throw new ReglaBodegaError("No se puede borrar: el artículo ya tiene kárdex. Desactívelo.");
  }
  const usado =
    db.cotizaciones.some((c) => c.items.some((i) => i.productoId === id)) ||
    db.facturas.some((f) => f.items.some((i) => i.productoId === id)) ||
    db.compras.some((c) => c.items.some((i) => i.productoId === id));
  if (usado) throw new ReglaBodegaError("No se puede borrar: está en una cotización, factura o compra.");
  db.productos = db.productos.filter((p) => p.id !== id);
}

export function desactivarProducto(db: DB, id: string, activo: boolean) {
  const producto = exigirProducto(db, id);
  producto.activo = activo;
  return producto;
}
