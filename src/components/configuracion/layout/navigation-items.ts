import {
  Building2,
  Receipt,
  CreditCard,
  Boxes,
  Users,
  Printer,
  Palette,
  Database,
  Clock,
} from "lucide-react";
import type { GrupoNavegacionConfig } from "../types";

export const GRUPOS_CONFIGURACION: GrupoNavegacionConfig[] = [
  {
    titulo: "Gestión Empresarial",
    items: [
      {
        id: "empresa",
        label: "Empresa & RUC",
        descripcion: "Razón social, RUC, dirección y datos fiscales",
        icon: Building2,
      },
      {
        id: "ventas_impuestos",
        label: "Ventas & Impuestos",
        descripcion: "IVA (15%), cotizaciones y reglas de facturación",
        icon: Receipt,
      },
      {
        id: "caja_pagos",
        label: "Caja & Medios de Pago",
        descripcion: "Política A (transferencias) y cuentas bancarias",
        icon: CreditCard,
      },
    ],
  },
  {
    titulo: "Operaciones & Equipo",
    items: [
      {
        id: "inventario",
        label: "Inventario & Políticas",
        descripcion: "Alertas de stock mínimo y visibilidad de costos",
        icon: Boxes,
      },
      {
        id: "usuarios",
        label: "Usuarios & Permisos",
        descripcion: "Roles RBAC (Admin, Cajero, Bodeguero, Vendedor)",
        icon: Users,
      },
    ],
  },
  {
    titulo: "Estación & Sistema",
    items: [
      {
        id: "dispositivo",
        label: "Dispositivo & Hardware",
        descripcion: "Impresora de tickets (80mm/58mm), lector y pantalla",
        icon: Printer,
        badge: "Local",
      },
      {
        id: "apariencia",
        label: "Apariencia & Temas",
        descripcion: "6 temas cromáticos del sistema comercial",
        icon: Palette,
      },
      {
        id: "mantenimiento_bd",
        label: "Base de Datos & Salud",
        descripcion: "Estado PostgreSQL WSL y respaldos del sistema",
        icon: Database,
      },
      {
        id: "sistema_hora",
        label: "Zona Horaria & Fecha",
        descripcion: "Zona horaria Nicaragua y formato de fecha",
        icon: Clock,
      },
    ],
  },
];
