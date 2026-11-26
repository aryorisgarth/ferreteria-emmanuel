import * as api from "@/lib/inventory/api";
import { transaccion } from "@/lib/inventory/store";
import type {
  CommercialTransactionContext,
  ICommercialRepository,
} from "../types";

export class JsonCommercialRepository implements ICommercialRepository {
  /**
   * Ejecuta una operación comercial dentro de la transacción atómica protegida del archivo JSON.
   */
  async runTransaction<T>(
    operation: (repo: ICommercialRepository, ctx: CommercialTransactionContext) => Promise<T> | T
  ): Promise<T> {
    const ctx: CommercialTransactionContext = {
      id: crypto.randomUUID(),
      fechaInicio: new Date().toISOString(),
    };
    return transaccion(async () => {
      return await operation(this, ctx);
    });
  }

  // --- Catálogo y Productos ---
  productos = api.productos;
  catalogo = api.catalogo;
  producto = api.producto;
  alta = api.alta;
  editarArticulo = api.editarArticulo;
  borrarArticulo = api.borrarArticulo;
  activarArticulo = api.activarArticulo;
  importar = api.importar;

  // --- Kárdex y Movimientos ---
  kardex = api.kardex;
  movimiento = api.movimiento;
  entrada = api.entrada;
  directa = api.directa;
  editar = api.editar;

  // --- Ventas y Facturación ---
  facturas = api.facturas;
  factura = api.factura;
  cuentasPorCobrar = api.cuentasPorCobrar;
  emitirFactura = api.emitirFactura;
  anularFactura = api.anularFactura;
  pagarFactura = api.pagarFactura;
  registrarDevolucionCliente = api.registrarDevolucionCliente;
  devolucionCliente = api.devolucionCliente;
  devolucionesCliente = api.devolucionesCliente;

  // --- Cotizaciones ---
  cotizaciones = api.cotizaciones;
  cotizacion = api.cotizacion;
  crearCotizacion = api.crearCotizacion;
  marcarCotizacion = api.marcarCotizacion;
  convertirCotizacionAVenta = api.convertirCotizacionAVenta;
  editarCotizacion = api.editarCotizacion;
  borrarCotizacion = api.borrarCotizacion;

  // --- Clientes y Proveedores ---
  clientes = api.clientes;
  cliente = api.cliente;
  perfilCliente = api.perfilCliente;
  altaCliente = api.altaCliente;
  guardarCliente = api.guardarCliente;
  desactivarCliente = api.desactivarCliente;
  buscarClientes = api.buscarClientes;
  borrarCliente = api.borrarCliente;
  proveedores = api.proveedores;
  proveedor = api.proveedor;
  perfilProveedor = api.perfilProveedor;
  altaProveedor = api.altaProveedor;
  guardarProveedor = api.guardarProveedor;
  desactivarProveedor = api.desactivarProveedor;
  buscarProveedores = api.buscarProveedores;
  borrarProveedor = api.borrarProveedor;

  // --- Compras y Abastecimiento ---
  compras = api.compras;
  compra = api.compra;
  altaCompra = api.altaCompra;
  anularCompra = api.anularCompra;
  cuentasPorPagar = api.cuentasPorPagar;
  altaAbonoCompra = api.altaAbonoCompra;
  pagosDeCompra = api.pagosDeCompra;

  // --- Pedidos y Recepciones ---
  pedidos = api.pedidos;
  pedido = api.pedido;
  altaPedido = api.altaPedido;
  cambiarEstadoPedido = api.cambiarEstadoPedido;
  recepciones = api.recepciones;
  recepcion = api.recepcion;
  altaRecepcion = api.altaRecepcion;

  // --- Devoluciones a Proveedor ---
  devoluciones = api.devoluciones;
  devolucion = api.devolucion;
  altaDevolucionProveedor = api.altaDevolucionProveedor;

  // --- Gastos Operativos ---
  gastos = api.gastos;
  todosLosGastos = api.todosLosGastos;
  gasto = api.gasto;
  altaGasto = api.altaGasto;
  guardarGasto = api.guardarGasto;
  borrarGasto = api.borrarGasto;

  // --- Caja y Arqueo ---
  turnoActivo = api.turnoActivo;
  abrirTurno = api.abrirTurno;
  cerrarTurno = api.cerrarTurno;
  registrarMovimientoCaja = api.registrarMovimientoCaja;
  turnos = api.turnos;
  movimientosTurno = api.movimientosTurno;

  // --- Ajustes y Conteo Físico ---
  ajustes = api.ajustes;
  registrarAjuste = api.registrarAjuste;
  conteos = api.conteos;
  conteo = api.conteo;
  registrarConteo = api.registrarConteo;
  aplicarConteo = api.aplicarConteo;

  // --- Solicitudes y Actas ---
  solicitudes = api.solicitudes;
  solicitud = api.solicitud;
  crear = api.crear;
  aprobar = api.aprobar;
  entregar = api.entregar;
  actas = api.actas;
  acta = api.acta;

  // --- Reportes y Resúmenes ---
  resumen = api.resumen;
  total = api.total;
  reporteVentasPeriodo = api.reporteVentasPeriodo;
  reporteVentasProducto = api.reporteVentasProducto;
  reporteVentasCajero = api.reporteVentasCajero;
  reporteVentasMedioPago = api.reporteVentasMedioPago;
  reporteComprasProveedor = api.reporteComprasProveedor;
  reporteDevoluciones = api.reporteDevoluciones;
  reporteValoracionInventario = api.reporteValoracionInventario;
  reporteCuentasPorPagar = api.reporteCuentasPorPagar;
  reporteCuentasPorCobrar = api.reporteCuentasPorCobrar;
  reporteCajaTurnos = api.reporteCajaTurnos;
  reporteAuditoria = api.reporteAuditoria;
  generarRespaldo = api.generarRespaldo;
}
