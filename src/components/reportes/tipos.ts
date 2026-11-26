import type { ProductoVista } from "@/lib/types";

export type ReporteId =
  | "inventario_general"
  | "lista_precios"
  | "toma_fisica"
  | "inventario_valorizado"
  | "kardex_movimientos"
  | "ventas_periodo"
  | "ventas_producto"
  | "ventas_cajero"
  | "ventas_medio_pago"
  | "compras_proveedor"
  | "cuentas_pagar"
  | "cuentas_cobrar"
  | "arqueo_caja"
  | "devoluciones"
  | "auditoria_trazabilidad";

export interface ReporteDef {
  id: ReporteId;
  titulo: string;
  subtitulo: string;
  categoria: "INVENTARIO" | "MOVIMIENTOS" | "VENTAS" | "COMPRAS" | "FINANZAS" | "AUDITORIA";
  estado: "FUNCIONAL";
  icono: React.ComponentType<{ size?: number; className?: string }>;
}

export interface CentroReportesProps {
  productos: ProductoVista[];
  categoriasDisponibles: string[];
  marcasDisponibles: string[];
  simbolo?: string;
  ventasPeriodo?: any;
  ventasProducto?: any;
  ventasCajero?: any;
  ventasMedioPago?: any;
  comprasProveedor?: any;
  devoluciones?: any;
  cuentasPorPagar?: any;
  cuentasPorCobrar?: any;
  cajaTurnos?: any;
  auditoria?: any;
  empresaConfig?: any;
}
