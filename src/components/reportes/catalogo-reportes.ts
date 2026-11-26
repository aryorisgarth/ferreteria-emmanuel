import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  FileSpreadsheet,
  Package,
  Receipt,
  ShieldCheck,
  Tags,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import type { ReporteDef } from "./tipos";

export const REPORTES_DISPONIBLES: ReporteDef[] = [
  // 1. Inventario y Existencias
  {
    id: "inventario_general",
    titulo: "Inventario Inicial",
    subtitulo: "Saldos de apertura y registro formal de inventario base del almacén.",
    categoria: "INVENTARIO", estado: "FUNCIONAL", icono: Package,
  },
  {
    id: "lista_precios",
    titulo: "Lista Oficial de Precios al Público",
    subtitulo: "Tarifa oficial de venta para mostrador y clientes comerciales",
    categoria: "INVENTARIO", estado: "FUNCIONAL", icono: Tags,
  },
  {
    id: "toma_fisica",
    titulo: "Toma Física y Conteo de Bodega",
    subtitulo: "Planilla de auditoría para conteo físico manual con firmas de recepción",
    categoria: "INVENTARIO", estado: "FUNCIONAL", icono: FileSpreadsheet,
  },
  {
    id: "inventario_valorizado",
    titulo: "Inventario Valorizado y Costo (CPP)",
    subtitulo: "Valuación financiera de existencias al Costo Promedio Ponderado y márgenes brutos",
    categoria: "INVENTARIO", estado: "FUNCIONAL", icono: DollarSign,
  },

  // 2. Movimientos
  {
    id: "kardex_movimientos",
    titulo: "Libro Kárdex de Movimientos",
    subtitulo: "Auditoría cronológica de entradas, salidas y saldo continuo",
    categoria: "MOVIMIENTOS", estado: "FUNCIONAL", icono: BookOpen,
  },

  // 3. Ventas Comerciales
  {
    id: "ventas_periodo",
    titulo: "Ventas por Período y Utilidad Bruta",
    subtitulo: "Consolidado de facturas, ventas netas, costo histórico Kárdex y rentabilidad",
    categoria: "VENTAS", estado: "FUNCIONAL", icono: Receipt,
  },
  {
    id: "ventas_producto",
    titulo: "Ventas por Producto y Top Vendidos",
    subtitulo: "Rendimiento por artículo: unidades vendidas, ingresos y margen generado",
    categoria: "VENTAS", estado: "FUNCIONAL", icono: BarChart3,
  },
  {
    id: "ventas_cajero",
    titulo: "Ventas por Cajero / Usuario",
    subtitulo: "Desglose de recaudación, cantidad de facturas y ticket promedio por cajero",
    categoria: "VENTAS", estado: "FUNCIONAL", icono: Users,
  },
  {
    id: "ventas_medio_pago",
    titulo: "Ventas por Medio de Pago",
    subtitulo: "Distribución de ventas en efectivo, transferencia bancaria, tarjeta y crédito",
    categoria: "VENTAS", estado: "FUNCIONAL", icono: Wallet,
  },

  // 4. Compras y Proveedores
  {
    id: "compras_proveedor",
    titulo: "Compras por Proveedor",
    subtitulo: "Resumen de compras acumuladas, facturas de distribuidoras y saldos adeudados",
    categoria: "COMPRAS", estado: "FUNCIONAL", icono: Truck,
  },
  {
    id: "devoluciones",
    titulo: "Devoluciones Comerciales",
    subtitulo: "Historial de devoluciones de clientes y devoluciones a proveedores",
    categoria: "COMPRAS", estado: "FUNCIONAL", icono: ArrowRight,
  },

  // 5. Finanzas y Cartera
  {
    id: "cuentas_cobrar",
    titulo: "Cuentas por Cobrar (Créditos Clientes)",
    subtitulo: "Facturas a crédito pendientes de liquidación y vencimientos",
    categoria: "FINANZAS", estado: "FUNCIONAL", icono: Calendar,
  },
  {
    id: "cuentas_pagar",
    titulo: "Cuentas por Pagar (Proveedores)",
    subtitulo: "Compras a crédito pendientes de pago y abonos realizados",
    categoria: "FINANZAS", estado: "FUNCIONAL", icono: Clock,
  },
  {
    id: "arqueo_caja",
    titulo: "Historial de Arqueos y Turnos de Caja",
    subtitulo: "Libro de turnos, fondos iniciales, recaudación en efectivo y diferencias",
    categoria: "FINANZAS", estado: "FUNCIONAL", icono: Wallet,
  },

  // 6. Auditoría y Trazabilidad
  {
    id: "auditoria_trazabilidad",
    titulo: "Auditoría y Trazabilidad de Operaciones Sensibles",
    subtitulo: "Registro cronológico inmutable de anulaciones, ajustes, mermas y salidas",
    categoria: "AUDITORIA", estado: "FUNCIONAL", icono: ShieldCheck,
  },
];

export const CATEGORIAS_MENU = [
  { id: "TODOS", label: "Todos los Reportes" },
  { id: "INVENTARIO", label: "Inventario y Existencias" },
  { id: "VENTAS", label: "Ventas y Rentabilidad" },
  { id: "COMPRAS", label: "Compras y Proveedores" },
  { id: "FINANZAS", label: "Caja y Cartera" },
  { id: "AUDITORIA", label: "Auditoría Oficial" },
  { id: "MOVIMIENTOS", label: "Kárdex de Bodega" },
] as const;
