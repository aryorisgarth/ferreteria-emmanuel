import { SqlExecutor } from "./client";
import { PostgresCommercialBase } from "./commercial-base";

export class PostgresCommercialOperationsBase extends PostgresCommercialBase {
  constructor(customExecutor?: SqlExecutor) {
    super(customExecutor);
  }

  // --- Compras y Abastecimiento ---
  compras = (page: number = 1) => this.purchasesService.compras(page);
  compra = (id: string) => this.purchasesService.compra(id);
  altaCompra = (input: any) => this.purchasesService.altaCompra(input);
  anularCompra = (id: string, usuario: string, motivo: string = "Anulación") =>
    this.purchasesService.anularCompra(id, usuario, motivo);
  cuentasPorPagar = () => this.purchasesService.cuentasPorPagar();
  altaAbonoCompra = (input: any) => this.purchasesService.altaAbonoCompra(input);
  pagosDeCompra = (compraId: string) => this.purchasesService.pagosDeCompra(compraId);
  pedidos = (page: number = 1) => this.purchasesService.pedidos(page);
  pedido = (id: string) => this.purchasesService.pedido(id);
  altaPedido = (input: any) => this.purchasesService.altaPedido(input);
  cambiarEstadoPedido = (id: string, estado: any) => this.purchasesService.cambiarEstadoPedido(id, estado);
  recepciones = (page: number = 1) => this.purchasesService.recepciones(page);
  recepcion = (id: string) => this.purchasesService.recepcion(id);
  altaRecepcion = (input: any) => this.purchasesService.altaRecepcion(input);
  devoluciones = (page: number = 1) => this.purchasesService.devoluciones(page);
  devolucion = (id: string) => this.purchasesService.devolucion(id);
  altaDevolucionProveedor = (input: any) => this.purchasesService.altaDevolucionProveedor(input);

  // --- Caja, Arqueo y Gastos ---
  gastos = (page: number = 1) => this.cashService.gastos(page);
  todosLosGastos = () => this.cashService.todosLosGastos();
  gasto = (id: string) => this.cashService.gasto(id);
  altaGasto = (input: any) => this.cashService.altaGasto(input);
  guardarGasto = (id: string, input: any) => this.cashService.guardarGasto(id, input);
  borrarGasto = (id: string) => this.cashService.borrarGasto(id);
  turnoActivo = (usuario?: string) => this.cashService.turnoActivo(usuario);
  abrirTurno = (input: any) => this.cashService.abrirTurno(input);
  cerrarTurno = (input: any) => this.cashService.cerrarTurno(input);
  registrarMovimientoCaja = (input: any) => this.cashService.registrarMovimientoCaja(input);
  turnos = (page: number = 1) => this.cashService.turnos(page);
  movimientosTurno = (turnoId: string) => this.cashService.movimientosTurno(turnoId);

  // --- Ajustes, Conteos y Actas ---
  ajustes = (page: number = 1) => this.warehouseService.ajustes(page);
  registrarAjuste = (input: any) => this.warehouseService.registrarAjuste(input);
  conteos = (page: number = 1) => this.warehouseService.conteos(page);
  conteo = (id: string) => this.warehouseService.conteo(id);
  registrarConteo = (input: any) => this.warehouseService.registrarConteo(input);
  aplicarConteo = (id: string, usuario: string) => this.warehouseService.aplicarConteo(id, usuario);
  solicitudes = (page: number = 1, estado?: any) => this.warehouseService.solicitudes(page, estado);
  solicitud = (id: string) => this.warehouseService.solicitud(id);
  crear = (input: any) => this.warehouseService.crear(input);
  aprobar = (id: string, usuario: string) => this.warehouseService.aprobar(id, usuario);
  entregar = (id: string, usuario: string) => this.warehouseService.entregar(id, usuario);
  actas = (page: number = 1) => this.warehouseService.actas(page);
  acta = (id: string) => this.warehouseService.acta(id);

  // --- Reportes y Resúmenes ---
  resumen = (fechaODias?: any) => this.reportsService.resumen(fechaODias);
  total = (fechaODias?: any, _page?: number) => this.reportsService.total(typeof fechaODias === "number" ? fechaODias : 1);
  reporteVentasPeriodo = (filtro?: any) => this.reportsService.reporteVentasPeriodo(filtro);
  reporteVentasProducto = (filtro?: any) => this.reportsService.reporteVentasProducto(filtro);
  reporteVentasCajero = (filtro?: any) => this.reportsService.reporteVentasCajero(filtro);
  reporteVentasMedioPago = (filtro?: any) => this.reportsService.reporteVentasMedioPago(filtro);
  reporteComprasProveedor = (filtro?: any) => this.reportsService.reporteComprasProveedor(filtro);
  reporteDevoluciones = (filtro?: any) => this.reportsService.reporteDevoluciones(filtro);
  reporteValoracionInventario = () => this.reportsService.reporteValoracionInventario();
  reporteCuentasPorPagar = () => this.reportsService.reporteCuentasPorPagar();
  reporteCuentasPorCobrar = () => this.reportsService.reporteCuentasPorCobrar();
  reporteCajaTurnos = (filtro?: any) => this.reportsService.reporteCajaTurnos(filtro);
  reporteAuditoria = (filtro?: any) => this.reportsService.reporteAuditoria(filtro);
  generarRespaldo = () => this.reportsService.generarRespaldo();
}
