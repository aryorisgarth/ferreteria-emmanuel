import type { LucideIcon } from "lucide-react";
import type { ConfiguracionSistema } from "@/lib/config";

export type SeccionConfiguracionId =
  | "empresa"
  | "ventas_impuestos"
  | "caja_pagos"
  | "inventario"
  | "usuarios"
  | "dispositivo"
  | "apariencia"
  | "mantenimiento_bd"
  | "sistema_hora";

export interface ItemNavegacionConfig {
  id: SeccionConfiguracionId;
  label: string;
  descripcion: string;
  icon: LucideIcon;
  badge?: string;
}

export interface GrupoNavegacionConfig {
  titulo: string;
  items: ItemNavegacionConfig[];
}

export interface ConfiguracionDispositivoLocal {
  formatoTicket: "80mm" | "58mm" | "carta";
  impresionAutomatica: boolean;
  lectorCodigoBarrasActivo: boolean;
  densidadInterfaz: "compacta" | "comoda";
  sonidoLectura: boolean;
}

export interface PanelConfiguracionProps {
  configuracion: ConfiguracionSistema;
  modoDb: "local" | "supabase" | "postgres";
  tabInicial?: string;
}
