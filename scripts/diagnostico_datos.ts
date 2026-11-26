import fs from "fs";
import path from "path";

interface DiagnosticoReporte {
  archivo: string;
  existe: boolean;
  tamanoBytes: number;
  entidades: Record<string, { total: number; muestra?: any }>;
  inconsistencias: string[];
}

function diagnosticar() {
  const dataDir = path.join(process.cwd(), "data");
  console.log("=== INICIANDO DIAGNÓSTICO DE DATOS LOCALES ===");

  const archivos = ["bodega.json", "configuracion.json", "usuarios.json"];
  const resultados: Record<string, any> = {};

  for (const archivo of archivos) {
    const fullPath = path.join(dataDir, archivo);
    if (!fs.existsSync(fullPath)) {
      console.warn(`[ALERTA] Archivo no encontrado: ${archivo}`);
      continue;
    }

    const contenidoRaw = fs.readFileSync(fullPath, "utf-8");
    const stats = fs.statSync(fullPath);
    let json: any;
    try {
      json = JSON.parse(contenidoRaw);
    } catch (e: any) {
      console.error(`[ERROR FATAL] JSON corrupto en ${archivo}:`, e.message);
      continue;
    }

    const rep: DiagnosticoReporte = {
      archivo,
      existe: true,
      tamanoBytes: stats.size,
      entidades: {},
      inconsistencias: [],
    };

    if (archivo === "bodega.json") {
      const keys = Object.keys(json);
      for (const k of keys) {
        if (Array.isArray(json[k])) {
          rep.entidades[k] = {
            total: json[k].length,
            muestra: json[k].length > 0 ? Object.keys(json[k][0]) : [],
          };
        } else if (typeof json[k] === "object") {
          rep.entidades[k] = {
            total: Object.keys(json[k]).length,
            muestra: Object.keys(json[k]),
          };
        }
      }

      // Verificaciones de integridad en bodega.json
      const prods = json.productos || [];
      const movs = json.movimientos || [];
      const facts = json.facturas || [];
      const clientes = json.clientes || [];

      // Chequeo de productos con stock negativo o valores nulos
      for (const p of prods) {
        if (p.existencia < 0) {
          rep.inconsistencias.push(`Producto ${p.id} (${p.nombre}) tiene existencia negativa: ${p.existencia}`);
        }
        if (p.precio < 0 || p.costo < 0) {
          rep.inconsistencias.push(`Producto ${p.id} (${p.nombre}) tiene precio o costo negativo.`);
        }
      }

      // Chequeo de clientes con saldo negativo
      for (const c of clientes) {
        if (c.saldoDeudor < 0) {
          rep.inconsistencias.push(`Cliente ${c.id} (${c.nombre}) tiene saldo negativo: ${c.saldoDeudor}`);
        }
      }
    } else if (archivo === "usuarios.json") {
      const users = Array.isArray(json) ? json : [];
      rep.entidades["usuarios"] = {
        total: users.length,
        muestra: users.map((u: any) => ({ id: u.id, usuario: u.usuario, rol: u.rol, activo: u.activo })),
      };
      const usernames = new Set<string>();
      for (const u of users) {
        if (usernames.has(u.usuario)) {
          rep.inconsistencias.push(`Usuario duplicado: ${u.usuario}`);
        }
        usernames.add(u.usuario);
        if (!u.passwordHash || u.passwordHash.length < 32) {
          rep.inconsistencias.push(`Usuario ${u.usuario} tiene hash de contraseña inválido o ausente.`);
        }
      }
    } else if (archivo === "configuracion.json") {
      rep.entidades["secciones"] = {
        total: Object.keys(json).length,
        muestra: Object.keys(json),
      };
      if (!json.empresa || !json.impuesto || !json.moneda) {
        rep.inconsistencias.push("Faltan secciones requeridas en configuracion.json (empresa, impuesto o moneda).");
      }
    }

    resultados[archivo] = rep;
  }

  console.log(JSON.stringify(resultados, null, 2));
}

diagnosticar();
