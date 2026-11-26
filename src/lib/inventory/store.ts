import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { libroVacio } from "@/lib/inventory/engine";
import type { DB, Producto } from "@/lib/types";

const rutaBaseDatos = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const archivo = process.env.DATA_BODEGA_PATH
  ? path.resolve(process.env.DATA_BODEGA_PATH)
  : path.join(rutaBaseDatos, "bodega.json");

if (process.env.E2E_TEST === "true" && process.env.STORAGE_PROVIDER !== "postgres") {
  const rutaRealBodega = path.resolve(process.cwd(), "data", "bodega.json");
  if (path.resolve(archivo) === rutaRealBodega) {
    throw new Error(
      "BLOQUEO DE SEGURIDAD E2E: El servidor de pruebas intentó acceder al archivo de bodega real data/bodega.json. Se exige un entorno aislado con DATA_DIR o DATA_BODEGA_PATH."
    );
  }
}

function asegurarModoJson(operacion: string) {
  if (process.env.STORAGE_PROVIDER === "postgres") {
    throw new Error(
      `BLOQUEO DE SEGURIDAD: Intento no autorizado de acceder a persistencia JSON (${operacion}) cuando STORAGE_PROVIDER='postgres'. Todos los módulos deben utilizar exclusivamente repositorios PostgreSQL.`
    );
  }
}

export function validarIntegridadDB(db: DB) {
  if (!db || typeof db !== "object") {
    throw new Error("Persistencia fallida: Estructura de base de datos no es un objeto válido.");
  }
  if (!Array.isArray(db.productos) || !Array.isArray(db.movimientos)) {
    throw new Error("Persistencia fallida: Arreglos maestros de inventario corruptos o ausentes.");
  }
  if (!db.folios || typeof db.folios !== "object") {
    throw new Error("Persistencia fallida: Objeto de folios ausente.");
  }
}

export function guardarSeguro(db: DB, destino: string = archivo) {
  asegurarModoJson("guardarSeguro");
  validarIntegridadDB(db);
  const serializado = JSON.stringify(db, null, 2);
  if (!serializado || serializado.length < 20) {
    throw new Error("Persistencia fallida: El contenido serializado es inválido o está truncado.");
  }

  const dir = path.dirname(destino);
  fs.mkdirSync(dir, { recursive: true });

  // Escritura atómica: se escribe primero en un archivo temporal único y se renombra atómicamente
  const tempArchivo = path.join(dir, `.tmp_${path.basename(destino)}_${crypto.randomUUID()}`);
  try {
    fs.writeFileSync(tempArchivo, serializado, "utf8");

    // En Windows renameSync puede sufrir contención momentánea por antivirus; implementar reintentos
    let intentos = 3;
    while (intentos > 0) {
      try {
        fs.renameSync(tempArchivo, destino);
        break;
      } catch (err) {
        intentos--;
        if (intentos === 0) throw err;
        const fin = Date.now() + 50;
        while (Date.now() < fin) {}
      }
    }
  } catch (error) {
    if (fs.existsSync(tempArchivo)) {
      try {
        fs.unlinkSync(tempArchivo);
      } catch {}
    }
    throw error;
  }
}

function guardar(db: DB) {
  guardarSeguro(db, archivo);
}

function producto(p: Producto): Producto {
  return {
    ...p,
    codigoBarras: p.codigoBarras || undefined,
    precio: p.precio ?? 0,
    costo: p.costo ?? 0,
    categoria: p.categoria || "Otros",
    marca: p.marca || "Genérica",
    stockMinimo: p.stockMinimo ?? 0,
    activo: p.activo !== false,
  };
}

function normalizar(db: Partial<DB>): DB {
  const base = libroVacio();
  return {
    ...base,
    ...db,
    productos: (db.productos ?? []).map(producto),
    oficinas: db.oficinas?.length ? db.oficinas : base.oficinas,
    solicitudes: db.solicitudes ?? [],
    actas: db.actas ?? [],
    movimientos: db.movimientos ?? [],
    cotizaciones: (db.cotizaciones ?? []).map((c) => ({ ...c, clienteId: c.clienteId ?? null })),
    facturas: (db.facturas ?? []).map((f) => ({
      ...f,
      clienteId: f.clienteId ?? null,
      formaPago: f.formaPago ?? "EFECTIVO",
      origen: f.origen ?? "DIRECTA",
    })),
    clientes: db.clientes ?? [],
    proveedores: db.proveedores ?? [],
    compras: db.compras ?? [],
    gastos: db.gastos ?? [],
    turnosCaja: db.turnosCaja ?? [],
    movimientosCaja: db.movimientosCaja ?? [],
    ajustesInventario: db.ajustesInventario ?? [],
    conteosFisicos: db.conteosFisicos ?? [],
    categorias: db.categorias?.length ? db.categorias : base.categorias,
    folios: { ...base.folios, ...(db.folios ?? {}) },
  };
}

function leer(): DB {
  asegurarModoJson("leer");
  if (!fs.existsSync(archivo)) {
    const db = libroVacio();
    guardar(db);
    return db;
  }
  return normalizar(JSON.parse(fs.readFileSync(archivo, "utf8")) as Partial<DB>);
}

export function consultar<T>(fn: (db: DB) => T): T {
  asegurarModoJson("consultar");
  return fn(structuredClone(leer()));
}

let transaccionBloqueada = false;

export function transaccion<T>(fn: (db: DB) => T): T {
  asegurarModoJson("transaccion");
  if (transaccionBloqueada) {
    throw new Error(
      "Conflicto de concurrencia: Ya existe una transacción de almacén en ejecución activa dentro de este proceso."
    );
  }
  transaccionBloqueada = true;
  try {
    const db = structuredClone(leer());
    const resultado = fn(db);
    guardar(db);
    return resultado;
  } finally {
    transaccionBloqueada = false;
  }
}

export function restaurarLibro() {
  asegurarModoJson("restaurarLibro");
  guardar(libroVacio());
}
