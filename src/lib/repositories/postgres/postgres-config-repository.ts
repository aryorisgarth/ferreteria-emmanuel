import type { IConfigRepository } from "../types";
import type { ConfiguracionSistema } from "@/lib/config";
import { query, SqlExecutor } from "./client";

export class PostgresConfigRepository implements IConfigRepository {
  private executor: SqlExecutor;

  constructor(customExecutor?: SqlExecutor) {
    this.executor = customExecutor || { query };
  }

  async obtener(): Promise<ConfiguracionSistema> {
    let usuarios: ConfiguracionSistema["usuarios"] = [];
    try {
      const usersRes = await this.executor.query(`
        SELECT id, usuario, nombre, rol, activo, creado_en as "creadoEn"
        FROM usuarios_cuentas
        ORDER BY usuario ASC
      `);
      usuarios = usersRes.rows.map((r: any) => ({
        id: r.id,
        usuario: r.usuario,
        nombre: r.nombre,
        rol: (r.rol === "admin" ? "ADMINISTRADOR" : r.rol.toUpperCase()) as any,
        activo: r.activo ?? true,
        creadoEn: r.creadoEn ? new Date(r.creadoEn).toISOString().split("T")[0] : "2026-01-01",
      }));
    } catch {}

    const res = await this.executor.query(`
      SELECT 
        nombre_empresa, ruc, direccion, telefono, correo, pie_factura,
        moneda, simbolo_moneda, iva_porcentaje, dias_credito_default
      FROM configuracion_sistema
      WHERE id = 'config_general'
      LIMIT 1
    `);

    if (res.rows.length === 0) {
      // Configuración predeterminada de Ferretería Emmanuel
      return {
        empresa: {
          nombre: "Ferretería Emmanuel",
          bodega: "Bodega Central",
          lema: "Construyendo con confianza",
          ruc: "J0310000123456",
          direccion: "Costado norte de la Iglesia La Merced, Managua",
          telefono: "+505 2222-3333",
          correo: "ventas@ferreteriaemmanuel.com.ni",
          pieFactura: "¡Gracias por su compra! Revise su mercadería antes de retirarse.",
          logoVariante: "color",
        },
        moneda: {
          nombre: "Córdoba nicaragüense",
          simbolo: "C$",
          codigo: "NIO",
        },
        impuesto: {
          nombre: "IVA",
          porcentaje: 15,
          aplicarPorDefecto: true,
        },
        ventas: {
          diasValidezCotizacion: 15,
          diasCreditoMaximo: 30,
          terminosCotizacion: "Precios sujetos a cambio sin previo aviso. Válido por 15 días calendario.",
        },
        sistema: {
          zonaHoraria: "America/Managua",
          formatoFecha: "DD/MM/YYYY",
        },
        usuarios,
      };
    }

    const row = res.rows[0];
    return {
      empresa: {
        nombre: row.nombre_empresa || "Ferretería Emmanuel",
        bodega: "Bodega Central",
        lema: "Construyendo con confianza",
        ruc: row.ruc || "",
        direccion: row.direccion || "",
        telefono: row.telefono || "",
        correo: row.correo || "",
        pieFactura: row.pie_factura || "¡Gracias por su compra!",
        logoVariante: "color",
      },
      moneda: {
        nombre: row.moneda === "DOLARES" ? "Dólar estadounidense" : "Córdoba nicaragüense",
        simbolo: row.simbolo_moneda || "C$",
        codigo: row.moneda === "DOLARES" ? "USD" : "NIO",
      },
      impuesto: {
        nombre: "IVA",
        porcentaje: Number(row.iva_porcentaje || 15),
        aplicarPorDefecto: true,
      },
      ventas: {
        diasValidezCotizacion: 15,
        diasCreditoMaximo: Number(row.dias_credito_default || 30),
        terminosCotizacion: "Precios sujetos a cambio sin previo aviso.",
      },
      sistema: {
        zonaHoraria: "America/Managua",
        formatoFecha: "DD/MM/YYYY",
      },
      usuarios,
    };
  }

  async guardar(config: ConfiguracionSistema): Promise<void> {
    await this.executor.query(
      `
      INSERT INTO configuracion_sistema (
        id, nombre_empresa, ruc, direccion, telefono, correo,
        moneda, simbolo_moneda, iva_porcentaje, dias_credito_default, pie_factura, actualizado_en
      ) VALUES (
        'config_general', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        nombre_empresa = EXCLUDED.nombre_empresa,
        ruc = EXCLUDED.ruc,
        direccion = EXCLUDED.direccion,
        telefono = EXCLUDED.telefono,
        correo = EXCLUDED.correo,
        moneda = EXCLUDED.moneda,
        simbolo_moneda = EXCLUDED.simbolo_moneda,
        iva_porcentaje = EXCLUDED.iva_porcentaje,
        dias_credito_default = EXCLUDED.dias_credito_default,
        pie_factura = EXCLUDED.pie_factura,
        actualizado_en = NOW()
    `,
      [
        config.empresa.nombre,
        config.empresa.ruc,
        config.empresa.direccion,
        config.empresa.telefono,
        config.empresa.correo,
        config.moneda.codigo === "USD" ? "DOLARES" : "CORDOBAS",
        config.moneda.simbolo,
        config.impuesto.porcentaje,
        config.ventas.diasCreditoMaximo,
        config.empresa.pieFactura,
      ]
    );
  }
}
