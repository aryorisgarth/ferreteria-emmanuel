"use server";

import * as auth from "./actions/auth.actions";
import * as caja from "./actions/caja.actions";
import * as ventas from "./actions/ventas.actions";
import * as solicitudes from "./actions/solicitudes.actions";
import * as articulos from "./actions/articulos.actions";
import * as inventario from "./actions/inventario.actions";
import * as cotizaciones from "./actions/cotizaciones.actions";
import * as entidades from "./actions/entidades.actions";
import * as pedidos from "./actions/pedidos-compra.actions";
import * as compras from "./actions/compras.actions";
import * as config from "./actions/configuracion.actions";

// Autenticación y usuarios
export async function loginAction(prev: any, formData: FormData) { return auth.loginAction(prev, formData); }
export async function ingresar(formData: FormData) { return auth.ingresar(formData); }
export async function solicitarRecuperacionAction(prev: any, formData: FormData) { return auth.solicitarRecuperacionAction(prev, formData); }
export async function salir() { return auth.salir(); }
export async function guardarUsuarioAction(formData: FormData) { return auth.guardarUsuarioAction(formData); }
export async function eliminarUsuarioAction(formData: FormData) { return auth.eliminarUsuarioAction(formData); }

// Caja y turnos
export async function cobrarAction(formData: FormData) { return caja.cobrarAction(formData); }
export async function abrirTurnoCajaAction(formData: FormData) { return caja.abrirTurnoCajaAction(formData); }
export async function registrarMovimientoCajaAction(formData: FormData) { return caja.registrarMovimientoCajaAction(formData); }
export async function cerrarTurnoCajaAction(formData: FormData) { return caja.cerrarTurnoCajaAction(formData); }

// Ventas y facturación
export async function crearFacturaAction(prev: any, formData: FormData) { return ventas.crearFacturaAction(prev, formData); }
export async function pagarFacturaAction(formData: FormData) { return ventas.pagarFacturaAction(formData); }
export async function verificarTransferenciaAction(formData: FormData) { return ventas.verificarTransferenciaAction(formData); }
export async function rechazarTransferenciaAction(formData: FormData) { return ventas.rechazarTransferenciaAction(formData); }
export async function anularFacturaAction(formData: FormData) { return ventas.anularFacturaAction(formData); }
export async function registrarDevolucionClienteAction(formData: FormData) { return ventas.registrarDevolucionClienteAction(formData); }

// Solicitudes internas y actas
export async function crearSolicitudAction(prev: any, formData: FormData) { return solicitudes.crearSolicitudAction(prev, formData); }
export async function aprobarAction(formData: FormData) { return solicitudes.aprobarAction(formData); }
export async function entregarAction(formData: FormData) { return solicitudes.entregarAction(formData); }

// Catálogo de artículos
export async function altaAction(formData: FormData) { return articulos.altaAction(formData); }
export async function editarArticuloAction(formData: FormData) { return articulos.editarArticuloAction(formData); }
export async function borrarArticuloAction(formData: FormData) { return articulos.borrarArticuloAction(formData); }
export async function activarArticuloAction(formData: FormData) { return articulos.activarArticuloAction(formData); }

// Inventario, kárdex y conteos
export async function entradaAction(prev: any, formData: FormData) { return inventario.entradaAction(prev, formData); }
export async function directaAction(prev: any, formData: FormData) { return inventario.directaAction(prev, formData); }
export async function importarAction(prev: any, formData: FormData) { return inventario.importarAction(prev, formData); }
export async function editarAction(prev: any, formData: FormData) { return inventario.editarAction(prev, formData); }
export async function crearAjusteInventarioAction(formData: FormData) { return inventario.crearAjusteInventarioAction(formData); }
export async function crearConteoFisicoAction(formData: FormData) { return inventario.crearConteoFisicoAction(formData); }
export async function aplicarConteoFisicoAction(formData: FormData) { return inventario.aplicarConteoFisicoAction(formData); }

// Cotizaciones
export async function crearCotizacionAction(prev: any, formData: FormData) { return cotizaciones.crearCotizacionAction(prev, formData); }
export async function editarCotizacionAction(prev: any, formData: FormData) { return cotizaciones.editarCotizacionAction(prev, formData); }
export async function enviarCotizacionAction(formData: FormData) { return cotizaciones.enviarCotizacionAction(formData); }
export async function aceptarCotizacionAction(formData: FormData) { return cotizaciones.aceptarCotizacionAction(formData); }
export async function rechazarCotizacionAction(formData: FormData) { return cotizaciones.rechazarCotizacionAction(formData); }
export async function vencerCotizacionAction(formData: FormData) { return cotizaciones.vencerCotizacionAction(formData); }
export async function facturarCotizacionAction(formData: FormData) { return cotizaciones.facturarCotizacionAction(formData); }
export async function borrarCotizacionAction(formData: FormData) { return cotizaciones.borrarCotizacionAction(formData); }

// Entidades (clientes, proveedores, gastos)
export async function guardarClienteAction(prev: any, formData: FormData) { return entidades.guardarClienteAction(prev, formData); }
export async function borrarClienteAction(formData: FormData) { return entidades.borrarClienteAction(formData); }
export async function desactivarClienteAction(formData: FormData) { return entidades.desactivarClienteAction(formData); }
export async function guardarProveedorAction(prev: any, formData: FormData) { return entidades.guardarProveedorAction(prev, formData); }
export async function borrarProveedorAction(formData: FormData) { return entidades.borrarProveedorAction(formData); }
export async function desactivarProveedorAction(formData: FormData) { return entidades.desactivarProveedorAction(formData); }
export async function guardarGastoAction(prev: any, formData: FormData) { return entidades.guardarGastoAction(prev, formData); }
export async function borrarGastoAction(formData: FormData) { return entidades.borrarGastoAction(formData); }

// Compras, pedidos y recepciones
export async function crearPedidoCompraAction(prev: any, formData: FormData) { return pedidos.crearPedidoCompraAction(prev, formData); }
export async function cambiarEstadoPedidoAction(formData: FormData) { return pedidos.cambiarEstadoPedidoAction(formData); }
export async function crearRecepcionCompraAction(prev: any, formData: FormData) { return pedidos.crearRecepcionCompraAction(prev, formData); }
export async function crearCompraAction(prev: any, formData: FormData) { return compras.crearCompraAction(prev, formData); }
export async function anularCompraAction(formData: FormData) { return compras.anularCompraAction(formData); }
export async function crearAbonoCompraAction(formData: FormData) { return compras.crearAbonoCompraAction(formData); }
export async function crearDevolucionProveedorAction(prev: any, formData: FormData) { return compras.crearDevolucionProveedorAction(prev, formData); }

// Configuración general
export async function restaurarAction(formData?: FormData) { return config.restaurarAction(formData); }
export async function guardarConfiguracionGeneralAction(formData: FormData) { return config.guardarConfiguracionGeneralAction(formData); }
