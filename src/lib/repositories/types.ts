import type * as api from "@/lib/inventory/api";
import type { ConfiguracionSistema } from "@/lib/config";
import type { UsuarioCuenta, RolUsuario } from "@/lib/auth";

// ============================================================================
// CONTRATOS TRANSACCIONALES (ACID)
// ============================================================================

/**
 * Contexto de transacción comercial atómica.
 * En PostgreSQL: encapsula una conexión de base de datos dedicada con BEGIN ... COMMIT / ROLLBACK.
 * En JSON: ejecuta el bloque protegido bajo el semáforo y clon atómico de store.ts.
 */
export interface CommercialTransactionContext {
  readonly id: string;
  readonly fechaInicio: string;
}

// ============================================================================
// CONTRATO DEL REPOSITORIO COMERCIAL (ICommercialRepository)
// ============================================================================

export interface ICommercialRepository {
  /**
   * Ejecuta una o más operaciones comerciales dentro de una transacción atómica protegida.
   * Si cualquier paso arroja un error, todas las mutaciones se revierten en bloque.
   */
  runTransaction<T>(
    operation: (repo: ICommercialRepository, ctx: CommercialTransactionContext) => Promise<T> | T
  ): Promise<T>;

  // --- Catálogo y Productos ---
  productos: typeof api.productos;
  catalogo: typeof api.catalogo;
  producto: typeof api.producto;
  alta: typeof api.alta;
  editarArticulo: typeof api.editarArticulo;
  borrarArticulo: typeof api.borrarArticulo;
  activarArticulo: typeof api.activarArticulo;
  importar: typeof api.importar;

  // --- Kárdex y Movimientos ---
  kardex: typeof api.kardex;
  movimiento: typeof api.movimiento;
  entrada: typeof api.entrada;
  directa: typeof api.directa;
  editar: typeof api.editar;

  // --- Ventas y Facturación ---
  facturas: typeof api.facturas;
  factura: typeof api.factura;
  cuentasPorCobrar: typeof api.cuentasPorCobrar;
  emitirFactura: typeof api.emitirFactura;
  anularFactura: typeof api.anularFactura;
  pagarFactura: typeof api.pagarFactura;
  registrarDevolucionCliente: typeof api.registrarDevolucionCliente;
  devolucionCliente: typeof api.devolucionCliente;
  devolucionesCliente: typeof api.devolucionesCliente;

  // --- Cotizaciones ---
  cotizaciones: typeof api.cotizaciones;
  cotizacion: typeof api.cotizacion;
  crearCotizacion: typeof api.crearCotizacion;
  marcarCotizacion: typeof api.marcarCotizacion;
  convertirCotizacionAVenta: typeof api.convertirCotizacionAVenta;
  editarCotizacion: typeof api.editarCotizacion;
  borrarCotizacion: typeof api.borrarCotizacion;

  // --- Clientes ---
  clientes: typeof api.clientes;
  cliente: typeof api.cliente;
  perfilCliente: typeof api.perfilCliente;
  altaCliente: typeof api.altaCliente;
  guardarCliente: typeof api.guardarCliente;
  desactivarCliente: typeof api.desactivarCliente;
  buscarClientes: typeof api.buscarClientes;
  borrarCliente: typeof api.borrarCliente;

  // --- Proveedores ---
  proveedores: typeof api.proveedores;
  proveedor: typeof api.proveedor;
  perfilProveedor: typeof api.perfilProveedor;
  altaProveedor: typeof api.altaProveedor;
  guardarProveedor: typeof api.guardarProveedor;
  desactivarProveedor: typeof api.desactivarProveedor;
  buscarProveedores: typeof api.buscarProveedores;
  borrarProveedor: typeof api.borrarProveedor;

  // --- Compras y Abastecimiento ---
  compras: typeof api.compras;
  compra: typeof api.compra;
  altaCompra: typeof api.altaCompra;
  anularCompra: typeof api.anularCompra;
  cuentasPorPagar: typeof api.cuentasPorPagar;
  altaAbonoCompra: typeof api.altaAbonoCompra;
  pagosDeCompra: typeof api.pagosDeCompra;

  // --- Pedidos y Recepciones ---
  pedidos: typeof api.pedidos;
  pedido: typeof api.pedido;
  altaPedido: typeof api.altaPedido;
  cambiarEstadoPedido: typeof api.cambiarEstadoPedido;
  recepciones: typeof api.recepciones;
  recepcion: typeof api.recepcion;
  altaRecepcion: typeof api.altaRecepcion;

  // --- Devoluciones a Proveedor ---
  devoluciones: typeof api.devoluciones;
  devolucion: typeof api.devolucion;
  altaDevolucionProveedor: typeof api.altaDevolucionProveedor;

  // --- Gastos Operativos ---
  gastos: typeof api.gastos;
  todosLosGastos: typeof api.todosLosGastos;
  gasto: typeof api.gasto;
  altaGasto: typeof api.altaGasto;
  guardarGasto: typeof api.guardarGasto;
  borrarGasto: typeof api.borrarGasto;

  // --- Caja y Arqueo ---
  turnoActivo: typeof api.turnoActivo;
  abrirTurno: typeof api.abrirTurno;
  cerrarTurno: typeof api.cerrarTurno;
  registrarMovimientoCaja: typeof api.registrarMovimientoCaja;
  turnos: typeof api.turnos;
  movimientosTurno: typeof api.movimientosTurno;

  // --- Ajustes y Conteo Físico ---
  ajustes: typeof api.ajustes;
  registrarAjuste: typeof api.registrarAjuste;
  conteos: typeof api.conteos;
  conteo: typeof api.conteo;
  registrarConteo: typeof api.registrarConteo;
  aplicarConteo: typeof api.aplicarConteo;

  // --- Solicitudes y Actas ---
  solicitudes: typeof api.solicitudes;
  solicitud: typeof api.solicitud;
  crear: typeof api.crear;
  aprobar: typeof api.aprobar;
  entregar: typeof api.entregar;
  actas: typeof api.actas;
  acta: typeof api.acta;

  // --- Reportes y Resúmenes ---
  resumen: typeof api.resumen;
  total: typeof api.total;
  reporteVentasPeriodo: typeof api.reporteVentasPeriodo;
  reporteVentasProducto: typeof api.reporteVentasProducto;
  reporteVentasCajero: typeof api.reporteVentasCajero;
  reporteVentasMedioPago: typeof api.reporteVentasMedioPago;
  reporteComprasProveedor: typeof api.reporteComprasProveedor;
  reporteDevoluciones: typeof api.reporteDevoluciones;
  reporteValoracionInventario: typeof api.reporteValoracionInventario;
  reporteCuentasPorPagar: typeof api.reporteCuentasPorPagar;
  reporteCuentasPorCobrar: typeof api.reporteCuentasPorCobrar;
  reporteCajaTurnos: typeof api.reporteCajaTurnos;
  reporteAuditoria: typeof api.reporteAuditoria;
  generarRespaldo: typeof api.generarRespaldo;
}

// ============================================================================
// CONTRATO DEL REPOSITORIO DE AUTENTICACIÓN (IAuthRepository)
// ============================================================================

export interface IAuthRepository {
  obtenerUsuarios(): Promise<UsuarioCuenta[]>;
  guardarUsuarios(usuarios: UsuarioCuenta[]): Promise<void>;
  buscarPorUsuario(nombreUsuario: string): Promise<UsuarioCuenta | null>;
  buscarPorId(id: string): Promise<UsuarioCuenta | null>;
  crearOActualizarUsuario(input: {
    id?: string;
    usuario: string;
    nombre: string;
    rol: RolUsuario;
    clave?: string;
    activo?: boolean;
  }): Promise<UsuarioCuenta>;
  eliminarUsuario(id: string): Promise<void>;
  registrarIntentoFallido(id: string, maxIntentos?: number, tiempoBloqueoMinutos?: number): Promise<{ intentos: number; bloqueadoHasta: string | null }>;
  resetearIntentos(id: string): Promise<void>;
  generarTokenRecuperacion?(usuarioOCorreo: string): Promise<{ ok: true; tokenPlano?: string; correo?: string; usuario?: string }>;
  validarTokenRecuperacion?(tokenPlano: string): Promise<UsuarioCuenta | null>;
  restablecerPasswordConToken?(tokenPlano: string, nuevoPasswordHash: string): Promise<boolean>;
  restablecerAccesoAdmin?(usuarioId: string, claveTemporalHash: string, adminUsuario: string): Promise<boolean>;
  cambiarPasswordObligatorio?(usuarioId: string, nuevoPasswordHash: string): Promise<boolean>;
  obtenerTemaUsuario?(usuarioOId: string): Promise<string>;
  guardarTemaUsuario?(usuarioOId: string, tema: string): Promise<boolean>;
}

// ============================================================================
// CONTRATO DEL REPOSITORIO DE CONFIGURACIÓN (IConfigRepository)
// ============================================================================

export interface IConfigRepository {
  obtener(): Promise<ConfiguracionSistema>;
  guardar(config: ConfiguracionSistema): Promise<void>;
}
