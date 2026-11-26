import "server-only";
import { cache } from "react";
import fs from "fs";
import path from "path";

export interface ConfiguracionSistema {
  empresa: {
    nombre: string;
    bodega: string;
    lema: string;
    ruc: string;
    direccion: string;
    telefono: string;
    correo: string;
    pieFactura: string;
    logoVariante: "light" | "color" | "gold";
  };
  moneda: {
    nombre: string;
    simbolo: string;
    codigo: string;
  };
  impuesto: {
    nombre: string;
    porcentaje: number;
    aplicarPorDefecto: boolean;
  };
  ventas: {
    diasValidezCotizacion: number;
    diasCreditoMaximo: number;
    terminosCotizacion: string;
  };
  sistema: {
    zonaHoraria: string;
    formatoFecha: string;
  };
  usuarios: Array<{
    id: string;
    usuario: string;
    nombre: string;
    rol: "ADMINISTRADOR" | "CAJERO" | "BODEGUERO" | "VENDEDOR";
    activo: boolean;
    creadoEn: string;
  }>;
}

const rutaBaseDatos = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

const CONFIG_PATH = process.env.DATA_CONFIG_PATH
  ? path.resolve(process.env.DATA_CONFIG_PATH)
  : path.join(rutaBaseDatos, "configuracion.json");

if (process.env.E2E_TEST === "true" && process.env.STORAGE_PROVIDER !== "postgres") {
  const rutaRealConfig = path.resolve(process.cwd(), "data", "configuracion.json");
  if (path.resolve(CONFIG_PATH) === rutaRealConfig) {
    throw new Error(
      "BLOQUEO DE SEGURIDAD E2E: El servidor de pruebas intentó acceder al archivo de configuración real data/configuracion.json."
    );
  }
}

export const CONFIG_DEFAULT: ConfiguracionSistema = {
  empresa: {
    nombre: "Ferretería Emmanuel",
    bodega: "Bodega Central de Materiales",
    lema: "Calidad, Confianza y Soluciones para la Construcción",
    ruc: "J0310000000000",
    direccion: "Managua, Nicaragua - De la rotonda 2c. al sur",
    telefono: "+505 2222-3344 / 8888-9900",
    correo: "contacto@ferreteriaemmanuel.com",
    pieFactura: "¡Gracias por su compra en Ferretería Emmanuel! Revise su mercadería antes de salir. Garantía 15 días con factura.",
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
    diasValidezCotizacion: 15,
    diasCreditoMaximo: 30,
    terminosCotizacion: "Precios sujetos a cambio sin previo aviso. Disponibilidad sujeta a existencia en bodega.",
  },
  sistema: {
    zonaHoraria: "America/Managua",
    formatoFecha: "DD/MM/YYYY",
  },
  usuarios: [
    {
      id: "usr-admin",
      usuario: "admin",
      nombre: "Administrador General",
      rol: "ADMINISTRADOR",
      activo: true,
      creadoEn: "2026-01-01",
    },
    {
      id: "usr-caja1",
      usuario: "cajero",
      nombre: "Caja Mostrador 1",
      rol: "CAJERO",
      activo: true,
      creadoEn: "2026-01-01",
    },
    {
      id: "usr-bodega1",
      usuario: "bodega",
      nombre: "Encargado de Almacén",
      rol: "BODEGUERO",
      activo: true,
      creadoEn: "2026-01-01",
    },
  ],
};

export function obtenerConfiguracionJson(): ConfiguracionSistema {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      guardarConfiguracionJson(CONFIG_DEFAULT);
      return CONFIG_DEFAULT;
    }
    const contenido = fs.readFileSync(CONFIG_PATH, "utf8");
    const data = JSON.parse(contenido);
    return {
      ...CONFIG_DEFAULT,
      ...data,
      empresa: { ...CONFIG_DEFAULT.empresa, ...(data.empresa || {}) },
      moneda: { ...CONFIG_DEFAULT.moneda, ...(data.moneda || {}) },
      impuesto: { ...CONFIG_DEFAULT.impuesto, ...(data.impuesto || {}) },
      ventas: { ...CONFIG_DEFAULT.ventas, ...(data.ventas || {}) },
      sistema: { ...CONFIG_DEFAULT.sistema, ...(data.sistema || {}) },
      usuarios: data.usuarios || CONFIG_DEFAULT.usuarios,
    };
  } catch {
    return CONFIG_DEFAULT;
  }
}

export function guardarConfiguracionJson(nuevaConfig: ConfiguracionSistema): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(nuevaConfig, null, 2), "utf8");
}

export const obtenerConfiguracion = cache(async function obtenerConfiguracion(): Promise<ConfiguracionSistema> {
  if (process.env.STORAGE_PROVIDER === "postgres") {
    const { getConfigRepository } = await import("@/lib/repositories");
    return getConfigRepository().obtener();
  }
  return obtenerConfiguracionJson();
});

export async function guardarConfiguracion(nuevaConfig: ConfiguracionSistema): Promise<void> {
  if (process.env.STORAGE_PROVIDER === "postgres") {
    const { getConfigRepository } = await import("@/lib/repositories");
    return getConfigRepository().guardar(nuevaConfig);
  }
  guardarConfiguracionJson(nuevaConfig);
}

export const obtenerConfiguracionSync = obtenerConfiguracionJson;
export const guardarConfiguracionSync = guardarConfiguracionJson;

