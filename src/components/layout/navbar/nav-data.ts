import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileCheck2,
  FileText,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";

export interface NavbarProps {
  usuario: string;
  alertas?: {
    stockBajo?: number;
    porCobrar?: number;
  };
}

export interface ItemModulo {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: (alertas?: NavbarProps["alertas"]) => number | null;
  tecla?: string;
}

export interface GrupoNav {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: ItemModulo[];
}

export const GRUPOS_NAVEGACION: GrupoNav[] = [
  {
    id: "ventas",
    label: "Ventas",
    icon: ShoppingCart,
    items: [
      { href: "/caja", label: "Punto de Venta (POS)", desc: "Mostrador rápido, lector de barras y cobro", icon: ShoppingCart, tecla: "F1" },
      { href: "/cotizaciones", label: "Cotizaciones", desc: "Presupuestos formales y autorizaciones", icon: FileText },
      { href: "/facturas", label: "Facturas", desc: "Comprobantes fiscales y devoluciones", icon: Receipt },
      { href: "/clientes", label: "Clientes", desc: "Directorio, RUC y límites de crédito", icon: Users },
    ],
  },
  {
    id: "inventario",
    label: "Inventario",
    icon: Package,
    items: [
      { href: "/inventario", label: "Catálogo de Artículos", desc: "Existencias, precios, marcas y categorías", icon: Package, badge: (a) => ((a?.stockBajo ?? 0) > 0 ? a!.stockBajo! : null) },
      { href: "/kardex", label: "Kárdex Valuado", desc: "Trazabilidad de movimientos y costos", icon: BookOpen },
      { href: "/compras", label: "Órdenes de Compra", desc: "Recepción de mercadería y proveedores", icon: Truck },
      { href: "/proveedores", label: "Proveedores", desc: "Casas distribuidoras y contactos", icon: Warehouse },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: BarChart3,
    items: [
      { href: "/total-del-dia", label: "Arqueo Diario", desc: "Cierre de turnos, efectivo y transferencias", icon: Receipt },
      { href: "/gastos", label: "Control de Gastos", desc: "Egresos operativos y comprobantes", icon: Wallet },
      { href: "/reportes", label: "Reportes Gerenciales", desc: "Ventas, margen de utilidad y métricas", icon: BarChart3 },
    ],
  },
  {
    id: "bodega",
    label: "Bodega",
    icon: Warehouse,
    items: [
      { href: "/bodega", label: "Panel de Bodega", desc: "Estado operativo de almacenes", icon: Warehouse },
      { href: "/solicitudes", label: "Solicitudes Internas", desc: "Requisiciones de materiales", icon: ClipboardList },
      { href: "/actas", label: "Actas de Entrega", desc: "Constancias firmadas de salida física", icon: FileCheck2 },
      { href: "/movimientos", label: "Movimientos", desc: "Traslados entre ubicaciones", icon: ArrowLeftRight },
    ],
  },
];
