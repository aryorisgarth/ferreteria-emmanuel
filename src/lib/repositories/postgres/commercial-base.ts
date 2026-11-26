import { query, SqlExecutor } from "./client";
import { PostgresProductsService } from "./postgres-products";
import { PostgresEntitiesService } from "./postgres-entities";
import { PostgresKardexService } from "./postgres-kardex";
import { PostgresSalesService } from "./postgres-sales";
import { PostgresQuotesService } from "./postgres-quotes";
import { PostgresPurchasesService } from "./postgres-purchases";
import { PostgresCashService } from "./postgres-cash";
import { PostgresWarehouseService } from "./postgres-warehouse";
import { PostgresReportsService } from "./postgres-reports";

export class PostgresCommercialBase {
  protected executor: SqlExecutor;
  protected productsService: PostgresProductsService;
  protected entitiesService: PostgresEntitiesService;
  protected kardexService: PostgresKardexService;
  protected salesService: PostgresSalesService;
  protected quotesService: PostgresQuotesService;
  protected purchasesService: PostgresPurchasesService;
  protected cashService: PostgresCashService;
  protected warehouseService: PostgresWarehouseService;
  protected reportsService: PostgresReportsService;

  constructor(customExecutor?: SqlExecutor) {
    this.executor = customExecutor || { query };
    this.productsService = new PostgresProductsService(this.executor);
    this.entitiesService = new PostgresEntitiesService(this.executor);
    this.kardexService = new PostgresKardexService(this.executor);
    this.salesService = new PostgresSalesService(this.executor);
    this.quotesService = new PostgresQuotesService(this.executor);
    this.purchasesService = new PostgresPurchasesService(this.executor);
    this.cashService = new PostgresCashService(this.executor);
    this.warehouseService = new PostgresWarehouseService(this.executor);
    this.reportsService = new PostgresReportsService(this.executor);
  }

  // --- Catálogo y Productos ---
  inventarioPaginado = (filtros: any) => this.productsService.inventarioPaginado(filtros);
  productos = (q: string = "", page: number = 1) => this.productsService.productos(q, page);
  catalogo = () => this.productsService.catalogo();
  producto = (id: string) => this.productsService.producto(id);
  alta = (datos: any) => this.productsService.alta(datos);
  editarArticulo = (id: string, datos: any) => this.productsService.editarArticulo(id, datos);
  borrarArticulo = (id: string) => this.productsService.borrarArticulo(id);
  activarArticulo = (id: string) => this.productsService.activarArticulo(id);
  importar = (filas: any[]) => this.productsService.importar(filas);

  // --- Kárdex y Movimientos ---
  kardex = (filtro: any) => this.kardexService.kardex(filtro);
  movimiento = (id: string) => this.kardexService.movimiento(id);
  entrada = (input: any) => this.kardexService.entrada(input);
  directa = (input: any) => this.kardexService.directa(input);
  editar = (id: string, input: any) => this.kardexService.editar(id, input);

  // --- Ventas y Facturación ---
  facturas = (page: number = 1) => this.salesService.facturas(page);
  factura = (id: string) => this.salesService.factura(id);
  cuentasPorCobrar = (page: number = 1, q: string = "") => this.salesService.cuentasPorCobrar(page, q);
  anularFactura = (id: string, usuario: string, motivo: string = "Anulación") =>
    this.salesService.anularFactura(id, usuario, motivo);
  pagarFactura = (id: string, formaPago: any) => this.salesService.pagarFactura(id, formaPago);
  registrarDevolucionCliente = (input: any) => this.salesService.registrarDevolucionCliente(input);
  devolucionCliente = (id: string) => this.salesService.devolucionCliente(id);
  devolucionesCliente = (filtros?: any) => this.salesService.devolucionesCliente(filtros);

  // --- Cotizaciones ---
  cotizaciones = (page: number = 1, estado?: any) => this.quotesService.cotizaciones(page, estado);
  cotizacion = (id: string) => this.quotesService.cotizacion(id);
  crearCotizacion = (input: any) => this.quotesService.crearCotizacion(input);
  marcarCotizacion = (id: string, estado: any) => this.quotesService.marcarCotizacion(id, estado);
  editarCotizacion = (id: string, input: any) => this.quotesService.editarCotizacion(id, input);
  borrarCotizacion = (id: string) => this.quotesService.borrarCotizacion(id);

  // --- Clientes y Proveedores ---
  clientes = (page: number = 1, q: string = "") => this.entitiesService.clientes(page, q);
  cliente = (id: string) => this.entitiesService.cliente(id);
  perfilCliente = (id: string) => this.entitiesService.perfilCliente(id);
  altaCliente = (datos: any) => this.entitiesService.altaCliente(datos);
  guardarCliente = (id: string, datos: any) => this.entitiesService.guardarCliente(id, datos);
  desactivarCliente = (id: string) => this.entitiesService.desactivarCliente(id);
  buscarClientes = (q: string) => this.entitiesService.buscarClientes(q);
  borrarCliente = (id: string) => this.entitiesService.borrarCliente(id);
  proveedores = (page: number = 1, q: string = "") => this.entitiesService.proveedores(page, q);
  proveedor = (id: string) => this.entitiesService.proveedor(id);
  perfilProveedor = (id: string) => this.entitiesService.perfilProveedor(id);
  altaProveedor = (datos: any) => this.entitiesService.altaProveedor(datos);
  guardarProveedor = (id: string, datos: any) => this.entitiesService.guardarProveedor(id, datos);
  desactivarProveedor = (id: string) => this.entitiesService.desactivarProveedor(id);
  buscarProveedores = (q: string) => this.entitiesService.buscarProveedores(q);
  borrarProveedor = (id: string) => this.entitiesService.borrarProveedor(id);
  oficinas = () => this.entitiesService.oficinas();
}
