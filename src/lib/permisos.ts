import type { RolUsuario } from "@/lib/auth";

/**
 * MATRIZ DE PERMISOS COMERCIALES Y ADMINISTRATIVOS
 * Define con precisión quirúrgica qué operaciones puede ejecutar cada rol en el servidor.
 */

export type OperacionComercial =
  | "VENTA_CREAR"
  | "VENTA_ANULAR"
  | "VENTA_DESCUENTO_HASTA_3"
  | "VENTA_DESCUENTO_ILIMITADO"
  | "COTIZACION_CREAR"
  | "COTIZACION_EDITAR"
  | "COMPRA_REGISTRAR"
  | "COMPRA_ANULAR"
  | "ARTICULO_ALTA"
  | "ARTICULO_EDITAR"
  | "ARTICULO_BORRAR"
  | "ARTICULO_CAMBIAR_PRECIO"
  | "INVENTARIO_AJUSTE"
  | "CAJA_ABRIR"
  | "CAJA_CERRAR"
  | "CAJA_ARQUEO_VER"
  | "GASTO_REGISTRAR"
  | "CLIENTE_GESTIONAR"
  | "PROVEEDOR_GESTIONAR"
  | "USUARIO_GESTIONAR"
  | "CONFIGURACION_SISTEMA";

export const PERMISOS_POR_ROL: Record<RolUsuario, ReadonlySet<OperacionComercial>> = {
  ADMINISTRADOR: new Set<OperacionComercial>([
    "VENTA_CREAR",
    "VENTA_ANULAR",
    "VENTA_DESCUENTO_HASTA_3",
    "VENTA_DESCUENTO_ILIMITADO",
    "COTIZACION_CREAR",
    "COTIZACION_EDITAR",
    "COMPRA_REGISTRAR",
    "COMPRA_ANULAR",
    "ARTICULO_ALTA",
    "ARTICULO_EDITAR",
    "ARTICULO_BORRAR",
    "ARTICULO_CAMBIAR_PRECIO",
    "INVENTARIO_AJUSTE",
    "CAJA_ABRIR",
    "CAJA_CERRAR",
    "CAJA_ARQUEO_VER",
    "GASTO_REGISTRAR",
    "CLIENTE_GESTIONAR",
    "PROVEEDOR_GESTIONAR",
    "USUARIO_GESTIONAR",
    "CONFIGURACION_SISTEMA",
  ]),

  CAJERO: new Set<OperacionComercial>([
    "VENTA_CREAR",
    "VENTA_DESCUENTO_HASTA_3",
    "COTIZACION_CREAR",
    "CAJA_ABRIR",
    "CAJA_CERRAR",
    "GASTO_REGISTRAR",
    "CLIENTE_GESTIONAR",
  ]),

  BODEGUERO: new Set<OperacionComercial>([
    "COMPRA_REGISTRAR",
    "ARTICULO_ALTA",
    "ARTICULO_EDITAR",
    "INVENTARIO_AJUSTE",
    "PROVEEDOR_GESTIONAR",
  ]),

  VENDEDOR: new Set<OperacionComercial>([
    "COTIZACION_CREAR",
    "COTIZACION_EDITAR",
    "CLIENTE_GESTIONAR",
  ]),
};

/**
 * Valida si un rol tiene permiso para ejecutar una operación
 */
export function tienePermiso(rol: RolUsuario, operacion: OperacionComercial): boolean {
  const permisos = PERMISOS_POR_ROL[rol];
  return permisos ? permisos.has(operacion) : false;
}

/**
 * Guardia de autorización para Server Actions
 */
export function exigirPermiso(rol: RolUsuario, operacion: OperacionComercial) {
  if (!tienePermiso(rol, operacion)) {
    throw new Error(`Acceso denegado: el rol "${rol}" no tiene permiso para la acción "${operacion}".`);
  }
}
