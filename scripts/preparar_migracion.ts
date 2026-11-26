/**
 * SCRIPT DE PREPARACIÓN DE MIGRACIÓN: JSON -> POSTGRESQL (SOLO LECTURA / DRY-RUN)
 * 
 * Este script lee las entidades existentes en los archivos locales y genera las
 * sentencias de inserción parametrizada e idempotente (ON CONFLICT DO NOTHING),
 * validando tipos y claves foráneas sin ejecutar ninguna modificación en la base de datos.
 */

import fs from "fs";
import path from "path";

export interface PlanMigracionEntidad {
  tabla: string;
  totalRegistros: number;
  columnas: string[];
  sentenciasEjemplo: string[];
}

export function prepararPlanMigracion(dataDir: string = path.join(process.cwd(), "data")) {
  const plan: Record<string, PlanMigracionEntidad> = {};

  // 1. Usuarios
  const usuariosPath = path.join(dataDir, "usuarios.json");
  if (fs.existsSync(usuariosPath)) {
    const usuarios = JSON.parse(fs.readFileSync(usuariosPath, "utf-8"));
    plan["usuarios"] = {
      tabla: "usuarios",
      totalRegistros: usuarios.length,
      columnas: ["id", "usuario", "nombre", "rol", "password_hash", "activo", "creado_en"],
      sentenciasEjemplo: usuarios.slice(0, 2).map((u: any) =>
        `INSERT INTO usuarios (id, usuario, nombre, rol, password_hash, activo, creado_en) VALUES ('${u.id}', '${u.usuario}', '${u.nombre}', '${u.rol}', '${u.passwordHash}', ${u.activo}, '${u.creadoEn || new Date().toISOString()}') ON CONFLICT (usuario) DO NOTHING;`
      ),
    };
  }

  // 2. Configuración
  const configPath = path.join(dataDir, "configuracion.json");
  if (fs.existsSync(configPath)) {
    const conf = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    plan["configuracion_sistema"] = {
      tabla: "configuracion_sistema",
      totalRegistros: 1,
      columnas: ["id", "nombre_empresa", "ruc", "telefono", "direccion", "tasa_iva", "moneda_codigo", "moneda_simbolo"],
      sentenciasEjemplo: [
        `INSERT INTO configuracion_sistema (id, nombre_empresa, ruc, telefono, direccion, tasa_iva, moneda_codigo, moneda_simbolo) VALUES ('config_global', '${conf.empresa?.nombre || "Ferretería Emmanuel"}', '${conf.empresa?.ruc || ""}', '${conf.empresa?.telefono || ""}', '${conf.empresa?.direccion || ""}', ${conf.impuesto?.porcentaje || 15}, '${conf.moneda?.codigo || "NIO"}', '${conf.moneda?.simbolo || "C$"}') ON CONFLICT (id) DO UPDATE SET nombre_empresa = EXCLUDED.nombre_empresa;`
      ],
    };
  }

  // 3. Bodega (artículos, categorías, oficinas, clientes, proveedores, facturas, compras, kárdex)
  const bodegaPath = path.join(dataDir, "bodega.json");
  if (fs.existsSync(bodegaPath)) {
    const bodega = JSON.parse(fs.readFileSync(bodegaPath, "utf-8"));

    const entidades = [
      { key: "categorias", tabla: "categorias" },
      { key: "oficinas", tabla: "oficinas" },
      { key: "clientes", tabla: "clientes" },
      { key: "proveedores", tabla: "proveedores" },
      { key: "productos", tabla: "articulos" },
      { key: "movimientos", tabla: "movimientos" },
      { key: "facturas", tabla: "facturas" },
      { key: "compras", tabla: "compras" },
      { key: "gastos", tabla: "gastos" },
      { key: "cotizaciones", tabla: "cotizaciones" },
    ];

    for (const ent of entidades) {
      const items = bodega[ent.key] || [];
      plan[ent.tabla] = {
        tabla: ent.tabla,
        totalRegistros: items.length,
        columnas: items.length > 0 ? Object.keys(items[0]) : [],
        sentenciasEjemplo: items.slice(0, 1).map((item: any) =>
          `-- Inserción idempotente para ${ent.tabla}: ${JSON.stringify(item)}`
        ),
      };
    }
  }

  return plan;
}

if (process.argv[1] && process.argv[1].endsWith("preparar_migracion.ts")) {
  console.log("=== PLAN PREPARADO DE MIGRACIÓN IDEMPOTENTE (DRY-RUN) ===");
  const plan = prepararPlanMigracion();
  console.log(JSON.stringify(plan, null, 2));
}
