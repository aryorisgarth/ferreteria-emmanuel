import type { SupabaseClient } from "@supabase/supabase-js";
import { RENGLONES_POR_HOJA, hoyISO } from "@/lib/format";
import { ReglaBodegaError } from "@/lib/inventory/engine";
import type { FiltroKardex } from "@/lib/inventory/modelos";
import type {
  EstadoAuditoria,
  EstadoSolicitud,
  FilaExcel,
  LineaCaptura,
  MovimientoVista,
  OrigenMovimiento,
  ProductoVista,
  TipoMovimiento,
  UnidadMedida,
} from "@/lib/types";

type Fila = Record<string, unknown>;

function fallar(error: { message: string } | null) {
  if (error) throw new ReglaBodegaError(error.message);
}

function num(valor: unknown) {
  return Number(valor ?? 0);
}

function texto(valor: unknown) {
  return String(valor ?? "");
}

function hoja(total: number, page: number | "ultima") {
  const pages = Math.max(1, Math.ceil(total / RENGLONES_POR_HOJA));
  const pedido = page === "ultima" ? pages : page;
  const segura = Math.min(Math.max(Number.isFinite(pedido) ? pedido : 1, 1), pages);
  return { page: segura, pages, total, from: (segura - 1) * RENGLONES_POR_HOJA, to: segura * RENGLONES_POR_HOJA - 1 };
}

function mapProducto(row: Fila): ProductoVista {
  return {
    id: texto(row.id),
    codigo: texto(row.codigo),
    nombre: texto(row.nombre),
    unidadMedida: texto(row.unidad_medida) as UnidadMedida,
    inventarioInicial: num(row.inventario_inicial),
    totalEntradas: num(row.total_entradas),
    totalSalidas: num(row.total_salidas),
    stockActual: num(row.stock_actual),
    precio: num(row.precio),
    costo: num(row.costo),
    categoria: texto(row.categoria) || "Otros",
    stockMinimo: num(row.stock_minimo),
    activo: row.activo !== false,
  };
}

function mapMovimiento(row: Fila): MovimientoVista {
  return {
    id: texto(row.id),
    productoId: texto(row.producto_id),
    fecha: texto(row.fecha),
    tipo: texto(row.tipo_movimiento) as TipoMovimiento,
    cantidad: num(row.cantidad),
    entradas: num(row.entradas),
    salidas: num(row.salidas),
    stockSaldo: num(row.stock_saldo),
    unidadMedida: texto(row.unidad_medida) as UnidadMedida,
    destinatario: texto(row.destinatario),
    oficinaId: row.oficina_id ? texto(row.oficina_id) : null,
    actaId: row.acta_id ? texto(row.acta_id) : null,
    actaItemId: row.acta_item_id ? texto(row.acta_item_id) : null,
    solicitudId: row.solicitud_id ? texto(row.solicitud_id) : null,
    solicitudItemId: row.solicitud_item_id ? texto(row.solicitud_item_id) : null,
    numeroReferencia: texto(row.numero_referencia || row.numero_acta),
    concepto: texto(row.concepto),
    usuario: texto(row.usuario_nombre),
    esAuditoria: Boolean(row.es_auditoria),
    estadoAuditoria: texto(row.estado_auditoria) as EstadoAuditoria,
    origen: texto(row.origen) as OrigenMovimiento,
    idempotencyKey: row.idempotency_key ? texto(row.idempotency_key) : null,
    secuencia: num(row.secuencia),
    createdAt: texto(row.created_at),
    codigo: texto(row.codigo),
    nombre: texto(row.nombre),
    oficinaNombre: texto(row.oficina_nombre),
  };
}

function textoBusqueda(q: string) {
  return q.trim().replace(/[,.%]/g, "");
}

export async function productos(sb: SupabaseClient, q: string, page: number) {
  const busqueda = textoBusqueda(q);
  let cuenta = sb.from("vista_stock").select("id", { count: "exact", head: true });
  if (busqueda) cuenta = cuenta.or(`codigo.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%`);
  const cabecera = await cuenta;
  fallar(cabecera.error);
  const rango = hoja(cabecera.count ?? 0, page);
  let datos = sb.from("vista_stock").select("*").order("codigo");
  if (busqueda) datos = datos.or(`codigo.ilike.%${busqueda}%,nombre.ilike.%${busqueda}%`);
  const { data, error } = await datos.range(rango.from, rango.to);
  fallar(error);
  return { rows: (data ?? []).map((row) => mapProducto(row as Fila)), page: rango.page, pages: rango.pages, total: rango.total };
}

export async function catalogo(sb: SupabaseClient) {
  const { data, error } = await sb.from("vista_stock").select("*").order("codigo");
  fallar(error);
  return (data ?? []).map((row) => mapProducto(row as Fila));
}

export async function producto(sb: SupabaseClient, id: string) {
  const { data, error } = await sb.from("vista_stock").select("*").eq("id", id).maybeSingle();
  fallar(error);
  return data ? mapProducto(data as Fila) : null;
}

export async function oficinas(sb: SupabaseClient) {
  const { data, error } = await sb.from("oficinas").select("id, nombre, tipo").eq("activo", true).order("nombre");
  fallar(error);
  return (data ?? []).map((row) => ({
    id: texto(row.id),
    nombre: texto(row.nombre),
    tipo: texto(row.tipo) as "OFICINA" | "DEPENDENCIA" | "PERSONA",
  }));
}

export async function solicitudes(sb: SupabaseClient, page: number, estado?: EstadoSolicitud) {
  let cuenta = sb.from("solicitudes").select("id", { count: "exact", head: true });
  if (estado) cuenta = cuenta.eq("estado", estado);
  const cabecera = await cuenta;
  fallar(cabecera.error);
  const rango = hoja(cabecera.count ?? 0, page);
  let datos = sb.from("solicitudes").select("id, numero, estado, solicitante, destinatario, fecha, oficina_id, acta_id, stock_aplicado").order("numero", { ascending: false });
  if (estado) datos = datos.eq("estado", estado);
  const { data, error } = await datos.range(rango.from, rango.to);
  fallar(error);
  const filas = data ?? [];
  const [oficinasRes, actasRes] = await Promise.all([
    sb.from("oficinas").select("id, nombre"),
    sb.from("actas_entrega").select("id, numero"),
  ]);
  fallar(oficinasRes.error);
  fallar(actasRes.error);
  const nombres = new Map((oficinasRes.data ?? []).map((o) => [texto(o.id), texto(o.nombre)]));
  const actas = new Map((actasRes.data ?? []).map((a) => [texto(a.id), texto(a.numero)]));
  return {
    rows: filas.map((row) => ({
      id: texto(row.id),
      numero: texto(row.numero),
      estado: texto(row.estado) as EstadoSolicitud,
      solicitante: texto(row.solicitante),
      destinatario: texto(row.destinatario),
      fecha: texto(row.fecha),
      oficinaNombre: nombres.get(texto(row.oficina_id)) ?? "",
      actaNumero: row.acta_id ? actas.get(texto(row.acta_id)) ?? null : null,
      stockAplicado: Boolean(row.stock_aplicado),
    })),
    page: rango.page,
    pages: rango.pages,
    total: rango.total,
  };
}

export async function solicitud(sb: SupabaseClient, id: string) {
  const { data, error } = await sb
    .from("solicitudes")
    .select("id, numero, estado, solicitante, destinatario, observaciones, fecha, oficina_id, acta_id, stock_aplicado")
    .eq("id", id)
    .maybeSingle();
  fallar(error);
  if (!data) return null;
  const [oficina, acta, items] = await Promise.all([
    sb.from("oficinas").select("nombre").eq("id", data.oficina_id).maybeSingle(),
    data.acta_id
      ? sb.from("actas_entrega").select("id, numero, ejecutada").eq("id", data.acta_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    sb.from("solicitud_items").select("id, producto_id, cantidad, unidad_medida, observacion, productos(codigo, nombre)").eq("solicitud_id", id),
  ]);
  fallar(oficina.error);
  fallar(acta.error);
  fallar(items.error);
  return {
    id: texto(data.id),
    numero: texto(data.numero),
    estado: texto(data.estado) as EstadoSolicitud,
    solicitante: texto(data.solicitante),
    destinatario: texto(data.destinatario),
    observaciones: texto(data.observaciones),
    fecha: texto(data.fecha),
    oficinaId: texto(data.oficina_id),
    oficinaNombre: texto(oficina.data?.nombre),
    actaId: acta.data ? texto(acta.data.id) : null,
    actaNumero: acta.data ? texto(acta.data.numero) : null,
    ejecutada: Boolean(acta.data?.ejecutada),
    stockAplicado: Boolean(data.stock_aplicado),
    items: (items.data ?? []).map((item) => {
      const producto = Array.isArray(item.productos) ? item.productos[0] : item.productos;
      return {
        id: texto(item.id),
        productoId: texto(item.producto_id),
        codigo: texto(producto?.codigo),
        nombre: texto(producto?.nombre),
        cantidad: num(item.cantidad),
        unidadMedida: texto(item.unidad_medida) as UnidadMedida,
        observacion: texto(item.observacion),
      };
    }),
  };
}

export async function crear(
  sb: SupabaseClient,
  input: {
    solicitante: string;
    oficinaId: string;
    destinatario: string;
    observaciones: string;
    fecha: string;
    creadoPor: string;
    items: LineaCaptura[];
  },
) {
  const { data, error } = await sb.rpc("crear_solicitud", {
    p_solicitante: input.solicitante,
    p_oficina_id: input.oficinaId,
    p_destinatario: input.destinatario,
    p_observaciones: input.observaciones,
    p_fecha: input.fecha,
    p_usuario: input.creadoPor,
    p_items: input.items.map((item) => ({
      producto_id: item.productoId,
      cantidad: item.cantidad,
      observacion: item.observacion ?? "",
    })),
  });
  fallar(error);
  return texto(data);
}

export async function aprobar(sb: SupabaseClient, id: string, usuario: string) {
  const { data, error } = await sb.rpc("aprobar_solicitud", { p_id: id, p_usuario: usuario });
  fallar(error);
  return texto(data);
}

export async function entregar(sb: SupabaseClient, id: string, usuario: string) {
  const { error } = await sb.rpc("entregar_solicitud", { p_id: id, p_usuario: usuario });
  fallar(error);
}

export async function entrada(
  sb: SupabaseClient,
  input: { productoId: string; cantidad: number; fecha: string; concepto: string; usuario: string; esAuditoria: boolean },
) {
  const { error } = await sb.rpc("registrar_entrada", {
    p_producto_id: input.productoId,
    p_cantidad: input.cantidad,
    p_fecha: input.fecha,
    p_concepto: input.concepto,
    p_usuario: input.usuario,
    p_es_auditoria: input.esAuditoria,
    p_origen: "MANUAL",
  });
  fallar(error);
}

export async function directa(
  sb: SupabaseClient,
  input: {
    oficinaId: string;
    destinatario: string;
    fecha: string;
    concepto: string;
    usuario: string;
    esAuditoria: boolean;
    items: LineaCaptura[];
  },
) {
  const { data, error } = await sb.rpc("salida_directa", {
    p_oficina_id: input.oficinaId,
    p_destinatario: input.destinatario,
    p_fecha: input.fecha,
    p_concepto: input.concepto,
    p_usuario: input.usuario,
    p_es_auditoria: input.esAuditoria,
    p_items: input.items.map((item) => ({
      producto_id: item.productoId,
      cantidad: item.cantidad,
      observacion: item.observacion ?? "",
    })),
  });
  fallar(error);
  return texto(data);
}

export async function kardex(sb: SupabaseClient, filtro: FiltroKardex) {
  const aplicar = (consulta: any) => {
    if (filtro.productoId) consulta = consulta.eq("producto_id", filtro.productoId);
    if (filtro.desde) consulta = consulta.gte("fecha", filtro.desde);
    if (filtro.hasta) consulta = consulta.lte("fecha", filtro.hasta);
    if (filtro.soloAuditoria) consulta = consulta.eq("es_auditoria", true);
    return consulta;
  };
  const cabecera = await aplicar(sb.from("vista_kardex").select("id", { count: "exact", head: true }));
  fallar(cabecera.error);
  const countTotal = cabecera.count ?? 0;
  const rango =
    filtro.page === "todas"
      ? { from: 0, to: Math.max(0, countTotal - 1), page: 1, pages: 1, total: countTotal }
      : hoja(countTotal, filtro.page ?? 1);
  const { data, error } = await aplicar(sb.from("vista_kardex").select("*"))
    .order("fecha", { ascending: true })
    .order("secuencia", { ascending: true })
    .range(rango.from, rango.to);
  fallar(error);
  return { rows: ((data ?? []) as Fila[]).map((row) => mapMovimiento(row)), page: rango.page, pages: rango.pages, total: rango.total };
}

export async function movimiento(sb: SupabaseClient, id: string) {
  const { data, error } = await sb.from("vista_kardex").select("*").eq("id", id).maybeSingle();
  fallar(error);
  return data ? mapMovimiento(data as Fila) : null;
}

export async function editar(
  sb: SupabaseClient,
  id: string,
  input: {
    cantidad: number;
    fecha: string;
    concepto: string;
    destinatario: string;
    oficinaId: string | null;
    esAuditoria: boolean;
    estadoAuditoria: EstadoAuditoria;
    usuario: string;
  },
) {
  const { error } = await sb.rpc("editar_movimiento", {
    p_id: id,
    p_cantidad: input.cantidad,
    p_fecha: input.fecha,
    p_concepto: input.concepto,
    p_destinatario: input.destinatario,
    p_oficina_id: input.oficinaId,
    p_es_auditoria: input.esAuditoria,
    p_estado_auditoria: input.estadoAuditoria,
    p_usuario: input.usuario,
  });
  fallar(error);
}

export async function actas(sb: SupabaseClient, page: number) {
  const cabecera = await sb.from("actas_entrega").select("id", { count: "exact", head: true });
  fallar(cabecera.error);
  const rango = hoja(cabecera.count ?? 0, page);
  const { data, error } = await sb
    .from("actas_entrega")
    .select("id, numero, fecha, destinatario, ejecutada, es_salida_directa, solicitud_id, oficina_id")
    .order("numero", { ascending: false })
    .range(rango.from, rango.to);
  fallar(error);
  const [oficinasRes, solicitudesRes] = await Promise.all([
    sb.from("oficinas").select("id, nombre"),
    sb.from("solicitudes").select("id, numero"),
  ]);
  fallar(oficinasRes.error);
  fallar(solicitudesRes.error);
  const nombres = new Map((oficinasRes.data ?? []).map((o) => [texto(o.id), texto(o.nombre)]));
  const solicitudes = new Map((solicitudesRes.data ?? []).map((s) => [texto(s.id), texto(s.numero)]));
  return {
    rows: (data ?? []).map((row) => ({
      id: texto(row.id),
      numero: texto(row.numero),
      fecha: texto(row.fecha),
      destinatario: texto(row.destinatario),
      oficinaNombre: nombres.get(texto(row.oficina_id)) ?? "",
      ejecutada: Boolean(row.ejecutada),
      esSalidaDirecta: Boolean(row.es_salida_directa),
      solicitudId: row.solicitud_id ? texto(row.solicitud_id) : null,
      solicitudNumero: row.solicitud_id ? solicitudes.get(texto(row.solicitud_id)) ?? null : null,
    })),
    page: rango.page,
    pages: rango.pages,
    total: rango.total,
  };
}

export async function acta(sb: SupabaseClient, id: string) {
  const { data, error } = await sb
    .from("actas_entrega")
    .select("id, numero, fecha, destinatario, ejecutada, es_salida_directa, solicitud_id, oficina_id, concepto")
    .eq("id", id)
    .maybeSingle();
  fallar(error);
  if (!data) return null;
  const [oficina, solicitudRes, items] = await Promise.all([
    sb.from("oficinas").select("nombre").eq("id", data.oficina_id).maybeSingle(),
    data.solicitud_id
      ? sb.from("solicitudes").select("id, numero").eq("id", data.solicitud_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    sb.from("acta_items").select("id, producto_id, cantidad, unidad_medida, observacion, productos(codigo, nombre)").eq("acta_id", id),
  ]);
  fallar(oficina.error);
  fallar(solicitudRes.error);
  fallar(items.error);
  return {
    id: texto(data.id),
    numero: texto(data.numero),
    fecha: texto(data.fecha),
    destinatario: texto(data.destinatario),
    oficinaNombre: texto(oficina.data?.nombre),
    ejecutada: Boolean(data.ejecutada),
    esSalidaDirecta: Boolean(data.es_salida_directa),
    solicitudId: solicitudRes.data ? texto(solicitudRes.data.id) : null,
    solicitudNumero: solicitudRes.data ? texto(solicitudRes.data.numero) : null,
    concepto: texto(data.concepto),
    items: (items.data ?? []).map((item) => {
      const producto = Array.isArray(item.productos) ? item.productos[0] : item.productos;
      return {
        id: texto(item.id),
        productoId: texto(item.producto_id),
        codigo: texto(producto?.codigo),
        nombre: texto(producto?.nombre),
        cantidad: num(item.cantidad),
        unidadMedida: texto(item.unidad_medida) as UnidadMedida,
        observacion: texto(item.observacion),
      };
    }),
  };
}

export async function total(sb: SupabaseClient, fecha: string, page: number) {
  const cabecera = await sb.from("vista_total_dia").select("producto_id", { count: "exact", head: true }).eq("fecha", fecha);
  fallar(cabecera.error);
  const rango = hoja(cabecera.count ?? 0, page);
  const { data, error } = await sb
    .from("vista_total_dia")
    .select("*")
    .eq("fecha", fecha)
    .order("codigo")
    .range(rango.from, rango.to);
  fallar(error);
  return {
    rows: (data ?? []).map((row) => ({
      productoId: texto(row.producto_id),
      codigo: texto(row.codigo),
      nombre: texto(row.nombre),
      unidadMedida: texto(row.unidad_medida) as UnidadMedida,
      total: num(row.total_despachado),
      destinatarios: texto(row.destinatarios).split(" · ").filter(Boolean),
    })),
    page: rango.page,
    pages: rango.pages,
    total: rango.total,
  };
}

export async function resumen(sb: SupabaseClient) {
  const ultima = await sb.from("kardex_movimientos").select("fecha").order("fecha", { ascending: false }).limit(1);
  fallar(ultima.error);
  const fecha = texto(ultima.data?.[0]?.fecha) || hoyISO();
  const estados: EstadoSolicitud[] = ["PENDIENTE_DE_REVISION", "APROBADO", "ENTREGADO"];
  const conteos = { PENDIENTE_DE_REVISION: 0, APROBADO: 0, ENTREGADO: 0 };
  for (const estado of estados) {
    const { count, error } = await sb.from("solicitudes").select("id", { count: "exact", head: true }).eq("estado", estado);
    fallar(error);
    conteos[estado] = count ?? 0;
  }
  const [ceros, despachos] = await Promise.all([
    sb.from("vista_stock").select("*").lte("stock_actual", 0).order("codigo"),
    sb.from("vista_total_dia").select("*").eq("fecha", fecha).order("codigo"),
  ]);
  fallar(ceros.error);
  fallar(despachos.error);
  const [nProductos, nCotizaciones, nFacturas, nPorCobrar] = await Promise.all([
    sb.from("productos").select("id", { count: "exact", head: true }),
    sb.from("cotizaciones").select("id", { count: "exact", head: true }),
    sb.from("facturas").select("id", { count: "exact", head: true }),
    sb.from("facturas").select("id", { count: "exact", head: true }).eq("estado", "EMITIDA"),
  ]);
  return {
    fecha,
    ventas: 0,
    cobrado: 0,
    porCobrar: 0,
    costoHoy: 0,
    gastosHoy: 0,
    utilidad: 0,
    productos: nProductos.count ?? 0,
    cotizaciones: nCotizaciones.error ? 0 : (nCotizaciones.count ?? 0),
    facturas: nFacturas.error ? 0 : (nFacturas.count ?? 0),
    clientes: 0,
    conteos,
    stockBajo: [],
    sinExistencia: (ceros.data ?? []).map((row) => mapProducto(row as Fila)),
    despachos: (despachos.data ?? []).map((row) => ({
      productoId: texto(row.producto_id),
      codigo: texto(row.codigo),
      nombre: texto(row.nombre),
      unidadMedida: texto(row.unidad_medida) as UnidadMedida,
      total: num(row.total_despachado),
      destinatarios: texto(row.destinatarios).split(" · ").filter(Boolean),
    })),
  };
}

export async function importar(sb: SupabaseClient, filas: FilaExcel[], usuario: string) {
  const { data, error } = await sb.rpc("importar_excel", {
    p_filas: filas.map((fila) => ({
      codigo: fila.codigo,
      tipo: fila.tipo,
      cantidad: fila.cantidad,
      fecha: fila.fecha,
      destinatario: fila.destinatario ?? "",
      concepto: fila.concepto ?? "",
      es_auditoria: Boolean(fila.esAuditoria),
    })),
    p_usuario: usuario,
  });
  fallar(error);
  return num(data);
}

export async function alta(
  sb: SupabaseClient,
  input: { codigo: string; nombre: string; unidadMedida: UnidadMedida; inventarioInicial: number; precio?: number; costo?: number },
) {
  const { error } = await sb.rpc("alta_producto", {
    p_codigo: input.codigo,
    p_nombre: input.nombre,
    p_unidad: input.unidadMedida,
    p_inicial: input.inventarioInicial,
  });
  fallar(error);
}

export async function fecha(sb: SupabaseClient) {
  const { data, error } = await sb.from("kardex_movimientos").select("fecha").order("fecha", { ascending: false }).limit(1);
  fallar(error);
  return texto(data?.[0]?.fecha) || hoyISO();
}
