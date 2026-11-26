import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { libroVacio, altaProducto } from "../src/lib/inventory/engine";
import type { DB } from "../src/lib/types";

const SALT = process.env.AUTH_SECRET || "FerreteriaEmmanuel_Nicaragua_2026_SecureSalt_#9223";

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + SALT)
    .digest("hex");
}

export const E2E_DATA_DIR = path.resolve(process.cwd(), "e2e-temp-data");
export const REAL_DATA_DIR = path.resolve(process.cwd(), "data");

export interface ArchivoControl {
  path: string;
  size: number;
  hash: string;
}

export function obtenerControlArchivosReales(): Record<string, ArchivoControl> {
  const archivos = ["bodega.json", "configuracion.json", "usuarios.json"];
  const control: Record<string, ArchivoControl> = {};

  for (const nombre of archivos) {
    const ruta = path.join(REAL_DATA_DIR, nombre);
    if (fs.existsSync(ruta)) {
      const contenido = fs.readFileSync(ruta);
      control[nombre] = {
        path: ruta,
        size: contenido.length,
        hash: crypto.createHash("sha256").update(contenido).digest("hex"),
      };
    }
  }
  return control;
}

export function verificarInviolabilidadDatosReales(controlInicial: Record<string, ArchivoControl>) {
  for (const [nombre, ctrl] of Object.entries(controlInicial)) {
    if (!fs.existsSync(ctrl.path)) {
      throw new Error(`VIOLACIÓN CRÍTICA: El archivo real ${ctrl.path} fue eliminado.`);
    }
    const contenido = fs.readFileSync(ctrl.path);
    const hashActual = crypto.createHash("sha256").update(contenido).digest("hex");
    if (hashActual !== ctrl.hash) {
      throw new Error(`VIOLACIÓN CRÍTICA: El archivo real ${ctrl.path} fue alterado durante las pruebas E2E.`);
    }
  }
}

export function inicializarEntornoE2EAislado() {
  // 1. Validar que la ruta de pruebas esté completamente aislada de data/
  if (path.resolve(E2E_DATA_DIR) === path.resolve(REAL_DATA_DIR)) {
    throw new Error("BLOQUEO DE SEGURIDAD: E2E_DATA_DIR coincide con REAL_DATA_DIR.");
  }

  fs.mkdirSync(E2E_DATA_DIR, { recursive: true });

  // 2. Crear bodega.json aislada con productos de prueba
  const db: DB = libroVacio();

  // Alta de productos de prueba
  const p1 = altaProducto(db, {
    codigo: "E2E-CEM",
    nombre: "Cemento Canal 42.5kg",
    categoria: "Construcción",
    marca: "Canal",
    unidadMedida: "BOLSA",
    inventarioInicial: 50,
    costo: 120,
    precio: 200,
    stockMinimo: 5,
  });

  const p2 = altaProducto(db, {
    codigo: "E2E-VAR",
    nombre: "Varilla de Hierro 3/8",
    categoria: "Construcción",
    marca: "Sidenor",
    unidadMedida: "UNIDAD",
    inventarioInicial: 40,
    costo: 90,
    precio: 150,
    stockMinimo: 10,
  });

  const p3 = altaProducto(db, {
    codigo: "E2E-PNT",
    nombre: "Pintura Anticorrosiva Gris Galón",
    categoria: "Pinturas",
    marca: "Corona",
    unidadMedida: "GALON",
    inventarioInicial: 2,
    costo: 300,
    precio: 450,
    stockMinimo: 5,
  });

  const p4 = altaProducto(db, {
    codigo: "E2E-CLV",
    nombre: "Clavos 2.5 pulgadas (Sin Stock)",
    categoria: "Ferretería General",
    marca: "Genérica",
    unidadMedida: "LIBRA",
    inventarioInicial: 0,
    costo: 15,
    precio: 30,
    stockMinimo: 5,
  });

  // Clientes de prueba
  db.clientes.push({
    id: "cli-e2e-1",
    nombre: "Constructora Las Colinas S.A.",
    identificacion: "J031000008888",
    tipo: "EMPRESA",
    telefono: "2277-8899",
    email: "compras@lascolinas.com.ni",
    direccion: "Reparto San Juan, Managua",
    limiteCredito: 25000,
    saldoPendiente: 0,
    activo: true,
    notas: "Cliente E2E",
  });

  fs.writeFileSync(path.join(E2E_DATA_DIR, "bodega.json"), JSON.stringify(db, null, 2), "utf8");

  // 3. Crear usuarios.json aislada
  const usuarios = [
    {
      id: "usr-admin-e2e",
      usuario: "admin",
      nombre: "Administrador General",
      passwordHash: hashPassword("admin123"),
      rol: "ADMINISTRADOR",
      activo: true,
      creadoEn: "2026-01-01",
    },
    {
      id: "usr-cajero-e2e",
      usuario: "cajero",
      nombre: "Cajero Principal E2E",
      passwordHash: hashPassword("caja123"),
      rol: "CAJERO",
      activo: true,
      creadoEn: "2026-01-01",
    },
    {
      id: "usr-vendedor-e2e",
      usuario: "vendedor",
      nombre: "Vendedor Sin Caja E2E",
      passwordHash: hashPassword("venta123"),
      rol: "VENDEDOR",
      activo: true,
      creadoEn: "2026-01-01",
    },
  ];
  fs.writeFileSync(path.join(E2E_DATA_DIR, "usuarios.json"), JSON.stringify(usuarios, null, 2), "utf8");

  // 4. Crear configuracion.json aislada
  const configuracion = {
    empresa: {
      nombre: "Ferretería Emmanuel (Entorno E2E)",
      bodega: "Bodega de Pruebas Automatizadas",
      lema: "Ambiente Aislado de Certificación E2E",
      ruc: "J0310000000000",
      direccion: "Managua, Nicaragua",
      telefono: "+505 2222-3344",
      correo: "certificacion@ferreteriaemmanuel.com",
      pieFactura: "Documento de prueba generado por certificación automatizada E2E.",
      logoVariante: "light",
    },
    moneda: {
      nombre: "Córdoba Nicaragüense",
      simbolo: "C$",
      codigo: "NIO",
    },
    impuesto: {
      nombre: "I.V.A.",
      porcentaje: 15,
      aplicarPorDefecto: true,
    },
    ventas: {
      permitirVentasSinStock: false,
      imprimirTicketAutomatico: false,
      solicitarVendedor: false,
    },
  };
  fs.writeFileSync(path.join(E2E_DATA_DIR, "configuracion.json"), JSON.stringify(configuracion, null, 2), "utf8");
}

export function limpiarEntornoE2EAislado() {
  if (fs.existsSync(E2E_DATA_DIR)) {
    fs.rmSync(E2E_DATA_DIR, { recursive: true, force: true });
  }
}
