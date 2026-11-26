-- ============================================================================
-- FERRETERÍA EMMANUEL — ESQUEMA RELACIONAL POSTGRESQL / NEON
-- Fase 2: Implementación de Base de Datos para Producción Serverless
-- Compatible con PostgreSQL 15+, Neon y Cloudflare Workers
-- ============================================================================

-- Habilitar extensión para generación de identificadores UUID si es necesario
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLA DE CONFIGURACIÓN DEL SISTEMA
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id TEXT PRIMARY KEY DEFAULT 'config_general',
    nombre_empresa TEXT NOT NULL DEFAULT 'Ferretería Emmanuel',
    ruc TEXT NOT NULL DEFAULT '',
    direccion TEXT NOT NULL DEFAULT '',
    telefono TEXT NOT NULL DEFAULT '',
    correo TEXT NOT NULL DEFAULT '',
    moneda TEXT NOT NULL DEFAULT 'CORDOBAS',
    simbolo_moneda TEXT NOT NULL DEFAULT 'C$',
    iva_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    modo_auditoria_estricto BOOLEAN NOT NULL DEFAULT false,
    permitir_stock_negativo BOOLEAN NOT NULL DEFAULT false,
    dias_credito_default INT NOT NULL DEFAULT 30,
    limite_credito_default NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    pie_factura TEXT NOT NULL DEFAULT 'Gracias por su compra en Ferretería Emmanuel',
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLA DE USUARIOS Y AUTENTICACIÓN
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios_cuentas (
    id TEXT PRIMARY KEY,
    usuario TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'bodega', 'auditor', 'solicitante', 'cajero', 'vendedor')),
    clave TEXT NOT NULL, -- Soporta formato $scrypt$ o SHA-256 legacy
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_cuentas_usuario ON usuarios_cuentas(usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_cuentas_rol ON usuarios_cuentas(rol);

-- ============================================================================
-- 3. CONSECUTIVOS Y FOLIOS (GENERACIÓN ATÓMICA DE NÚMEROS DE DOCUMENTO)
-- ============================================================================
CREATE TABLE IF NOT EXISTS consecutivos_folios (
    tipo TEXT PRIMARY KEY,
    ultimo_numero BIGINT NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. OFICINAS Y DEPENDENCIAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS oficinas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'OFICINA' CHECK (tipo IN ('OFICINA', 'DEPENDENCIA', 'PERSONA')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. CLIENTES Y PROVEEDORES (PERSONAS Y EMPRESAS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL DEFAULT '',
    direccion TEXT NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    identificacion TEXT,
    email TEXT,
    tipo TEXT NOT NULL DEFAULT 'PARTICULAR' CHECK (tipo IN ('PARTICULAR', 'EMPRESA')),
    contacto TEXT,
    dias_credito INT NOT NULL DEFAULT 0,
    limite_credito NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_identificacion ON clientes(identificacion);

CREATE TABLE IF NOT EXISTS proveedores (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL DEFAULT '',
    direccion TEXT NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    identificacion TEXT,
    email TEXT,
    tipo TEXT NOT NULL DEFAULT 'EMPRESA' CHECK (tipo IN ('PARTICULAR', 'EMPRESA')),
    contacto TEXT,
    dias_credito INT NOT NULL DEFAULT 0,
    limite_credito NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_identificacion ON proveedores(identificacion);

-- ============================================================================
-- 6. PRODUCTOS E INVENTARIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS productos (
    id TEXT PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    codigo_barras TEXT,
    nombre TEXT NOT NULL,
    marca TEXT DEFAULT 'Genérica',
    unidad_medida TEXT NOT NULL,
    inventario_inicial NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    stock_actual NUMERIC(14, 4) NOT NULL DEFAULT 0.0000 CHECK (stock_actual >= 0),
    precio NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (precio >= 0),
    costo NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (costo >= 0),
    categoria TEXT NOT NULL DEFAULT 'General',
    stock_minimo NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- ============================================================================
-- 7. TURNOS Y MOVIMIENTOS DE CAJA
-- ============================================================================
CREATE TABLE IF NOT EXISTS turnos_caja (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    usuario TEXT NOT NULL,
    fecha_apertura TIMESTAMPTZ NOT NULL,
    fecha_cierre TIMESTAMPTZ,
    monto_inicial NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_final_real NUMERIC(12, 2),
    diferencia NUMERIC(12, 2),
    total_ventas_efectivo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_ventas_transferencia NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_ventas_tarjeta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_ventas_credito NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_ingresos_extra NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_egresos NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado TEXT NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO')),
    notas TEXT NOT NULL DEFAULT '',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turnos_caja_usuario ON turnos_caja(usuario);
CREATE INDEX IF NOT EXISTS idx_turnos_caja_estado ON turnos_caja(estado);

CREATE TABLE IF NOT EXISTS movimientos_caja (
    id TEXT PRIMARY KEY,
    turno_caja_id TEXT NOT NULL REFERENCES turnos_caja(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    concepto TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    usuario TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_caja_turno ON movimientos_caja(turno_caja_id);

-- ============================================================================
-- 8. GASTOS OPERATIVOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS gastos (
    id TEXT PRIMARY KEY,
    fecha TIMESTAMPTZ NOT NULL,
    concepto TEXT NOT NULL,
    categoria TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    notas TEXT NOT NULL DEFAULT '',
    creado_por TEXT NOT NULL,
    turno_caja_id TEXT REFERENCES turnos_caja(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);

-- ============================================================================
-- 9. COTIZACIONES
-- ============================================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    folio TEXT,
    cliente TEXT NOT NULL,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    fecha TIMESTAMPTZ NOT NULL,
    fecha_vencimiento TIMESTAMPTZ,
    estado TEXT NOT NULL CHECK (estado IN ('BORRADOR', 'EMITIDA', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA', 'FACTURADA')),
    notas TEXT NOT NULL DEFAULT '',
    condiciones_comerciales TEXT NOT NULL DEFAULT '',
    creado_por TEXT NOT NULL,
    factura_id TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    iva NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente_id ON cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);

CREATE TABLE IF NOT EXISTS cotizacion_items (
    id TEXT PRIMARY KEY,
    cotizacion_id TEXT NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    unidad_medida TEXT NOT NULL,
    observacion TEXT NOT NULL DEFAULT '',
    costo_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    exento_iva BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion ON cotizacion_items(cotizacion_id);

-- ============================================================================
-- 10. FACTURAS Y VENTAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS facturas (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    cliente TEXT NOT NULL,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    fecha TIMESTAMPTZ NOT NULL,
    cotizacion_id TEXT REFERENCES cotizaciones(id) ON DELETE SET NULL,
    notas TEXT NOT NULL DEFAULT '',
    creado_por TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('EMITIDA', 'PAGADA', 'ANULADA')),
    stock_aplicado BOOLEAN NOT NULL DEFAULT true,
    forma_pago TEXT NOT NULL CHECK (forma_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CREDITO')),
    origen TEXT NOT NULL CHECK (origen IN ('CAJA', 'COTIZACION', 'DIRECTA')),
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    iva NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    costo_total_venta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_recibido NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cambio NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    anulada BOOLEAN NOT NULL DEFAULT false,
    motivo_anulacion TEXT,
    anulada_por TEXT,
    fecha_anulacion TIMESTAMPTZ,
    clave_idempotencia TEXT UNIQUE,
    turno_caja_id TEXT REFERENCES turnos_caja(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_clave_idempotencia ON facturas(clave_idempotencia);

CREATE TABLE IF NOT EXISTS factura_items (
    id TEXT PRIMARY KEY,
    factura_id TEXT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    unidad_medida TEXT NOT NULL,
    observacion TEXT NOT NULL DEFAULT '',
    costo_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    exento_iva BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_factura_items_factura ON factura_items(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_items_producto ON factura_items(producto_id);

-- ============================================================================
-- 11. DEVOLUCIONES DE CLIENTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS devoluciones_cliente (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    factura_id TEXT NOT NULL REFERENCES facturas(id),
    factura_numero TEXT NOT NULL,
    cliente TEXT NOT NULL,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    fecha TIMESTAMPTZ NOT NULL,
    motivo TEXT NOT NULL,
    responsable TEXT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    iva NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_reintegro NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    metodo_reintegro TEXT NOT NULL CHECK (metodo_reintegro IN ('EFECTIVO', 'NOTA_CREDITO')),
    reintegro_caja_id TEXT REFERENCES turnos_caja(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devoluciones_cliente_factura ON devoluciones_cliente(factura_id);

CREATE TABLE IF NOT EXISTS devolucion_cliente_items (
    id TEXT PRIMARY KEY,
    devolucion_id TEXT NOT NULL REFERENCES devoluciones_cliente(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    precio_venta NUMERIC(12, 2) NOT NULL CHECK (precio_venta >= 0),
    costo_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    observacion TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_devolucion_cliente_items_devolucion ON devolucion_cliente_items(devolucion_id);

-- ============================================================================
-- 12. PEDIDOS Y RECEPCIONES DE COMPRA
-- ============================================================================
CREATE TABLE IF NOT EXISTS pedidos_compra (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    proveedor_id TEXT REFERENCES proveedores(id) ON DELETE SET NULL,
    proveedor TEXT NOT NULL,
    fecha_emision TIMESTAMPTZ NOT NULL,
    fecha_entrega_estimada TIMESTAMPTZ,
    estado TEXT NOT NULL CHECK (estado IN ('BORRADOR', 'EMITIDO', 'PARCIAL', 'RECIBIDO', 'CANCELADO')),
    notas TEXT NOT NULL DEFAULT '',
    creado_por TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedido_compra_items (
    id TEXT PRIMARY KEY,
    pedido_id TEXT NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    cantidad_pedida NUMERIC(14, 4) NOT NULL CHECK (cantidad_pedida > 0),
    cantidad_recibida NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    observacion TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS recepciones_compra (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    pedido_id TEXT REFERENCES pedidos_compra(id) ON DELETE SET NULL,
    proveedor_id TEXT REFERENCES proveedores(id) ON DELETE SET NULL,
    proveedor TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    remision_proveedor TEXT,
    responsable TEXT NOT NULL,
    estado_conformidad TEXT CHECK (estado_conformidad IN ('CONFORME', 'INCOMPLETO', 'CON_DANOS')),
    notas TEXT NOT NULL DEFAULT '',
    stock_aplicado BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recepcion_compra_items (
    id TEXT PRIMARY KEY,
    recepcion_id TEXT NOT NULL REFERENCES recepciones_compra(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    cantidad_recibida NUMERIC(14, 4) NOT NULL CHECK (cantidad_recibida > 0),
    costo_unitario NUMERIC(12, 2) NOT NULL CHECK (costo_unitario >= 0),
    linea_pedido_id TEXT,
    observacion TEXT NOT NULL DEFAULT ''
);

-- ============================================================================
-- 13. COMPRAS Y CUENTAS POR PAGAR
-- ============================================================================
CREATE TABLE IF NOT EXISTS compras (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    factura_proveedor TEXT,
    proveedor_id TEXT REFERENCES proveedores(id) ON DELETE SET NULL,
    proveedor TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    notas TEXT NOT NULL DEFAULT '',
    creado_por TEXT NOT NULL,
    anulada BOOLEAN NOT NULL DEFAULT false,
    fecha_anulacion TIMESTAMPTZ,
    anulada_por TEXT,
    motivo_anulacion TEXT,
    pedido_id TEXT REFERENCES pedidos_compra(id) ON DELETE SET NULL,
    recepcion_id TEXT REFERENCES recepciones_compra(id) ON DELETE SET NULL,
    stock_aplicado BOOLEAN NOT NULL DEFAULT true,
    condicion_pago TEXT NOT NULL DEFAULT 'CONTADO' CHECK (condicion_pago IN ('CONTADO', 'CREDITO')),
    forma_pago TEXT NOT NULL DEFAULT 'EFECTIVO' CHECK (forma_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO')),
    dias_credito INT NOT NULL DEFAULT 0,
    fecha_vencimiento TIMESTAMPTZ,
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado_pago TEXT NOT NULL DEFAULT 'PAGADO' CHECK (estado_pago IN ('PAGADO', 'PENDIENTE', 'PARCIAL')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    iva NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compras_proveedor_id ON compras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha);
CREATE INDEX IF NOT EXISTS idx_compras_estado_pago ON compras(estado_pago);

CREATE TABLE IF NOT EXISTS compra_items (
    id TEXT PRIMARY KEY,
    compra_id TEXT NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    unidad_medida TEXT NOT NULL,
    observacion TEXT NOT NULL DEFAULT '',
    costo_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    exento_iva BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_compra_items_compra ON compra_items(compra_id);

CREATE TABLE IF NOT EXISTS pagos_compra (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    compra_id TEXT NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    proveedor_id TEXT REFERENCES proveedores(id) ON DELETE SET NULL,
    fecha TIMESTAMPTZ NOT NULL,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    forma_pago TEXT NOT NULL CHECK (forma_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO')),
    referencia TEXT,
    notas TEXT NOT NULL DEFAULT '',
    creado_por TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_compra_compra ON pagos_compra(compra_id);

-- ============================================================================
-- 14. DEVOLUCIONES A PROVEEDOR
-- ============================================================================
CREATE TABLE IF NOT EXISTS devoluciones_proveedor (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    compra_id TEXT NOT NULL REFERENCES compras(id),
    proveedor_id TEXT REFERENCES proveedores(id) ON DELETE SET NULL,
    proveedor TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    motivo TEXT NOT NULL,
    nota_credito_proveedor TEXT,
    creado_por TEXT NOT NULL,
    stock_aplicado BOOLEAN NOT NULL DEFAULT true,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devolucion_proveedor_items (
    id TEXT PRIMARY KEY,
    devolucion_id TEXT NOT NULL REFERENCES devoluciones_proveedor(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    costo_unitario NUMERIC(12, 2) NOT NULL CHECK (costo_unitario >= 0),
    costo_libros NUMERIC(12, 2),
    observacion TEXT NOT NULL DEFAULT ''
);

-- ============================================================================
-- 15. AJUSTES DE INVENTARIO Y CONTEOS FÍSICOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS conteos_fisicos (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    usuario TEXT NOT NULL,
    notas TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'APLICADO')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conteo_fisico_items (
    id TEXT PRIMARY KEY,
    conteo_id TEXT NOT NULL REFERENCES conteos_fisicos(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    stock_sistema NUMERIC(14, 4) NOT NULL,
    conteo_fisico NUMERIC(14, 4) NOT NULL,
    diferencia NUMERIC(14, 4) NOT NULL,
    observacion TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS ajustes_inventario (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('SOBRANTE', 'FALTANTE', 'DANO', 'MERMA', 'CORRECCION')),
    cantidad NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    signo SMALLINT NOT NULL CHECK (signo IN (1, -1)),
    stock_previo NUMERIC(14, 4) NOT NULL,
    stock_nuevo NUMERIC(14, 4) NOT NULL,
    costo_unitario NUMERIC(12, 2) NOT NULL,
    valor_total NUMERIC(12, 2) NOT NULL,
    motivo TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    usuario TEXT NOT NULL,
    conteo_id TEXT REFERENCES conteos_fisicos(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 16. SOLICITUDES Y ACTAS DE ENTREGA (MÓDULO BODEGA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS solicitudes (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('PENDIENTE_DE_REVISION', 'APROBADO', 'ENTREGADO')),
    solicitante TEXT NOT NULL,
    oficina_id TEXT NOT NULL REFERENCES oficinas(id),
    destinatario TEXT NOT NULL DEFAULT '',
    observaciones TEXT NOT NULL DEFAULT '',
    fecha TIMESTAMPTZ NOT NULL,
    acta_id TEXT,
    stock_aplicado BOOLEAN NOT NULL DEFAULT false,
    creado_por TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solicitud_items (
    id TEXT PRIMARY KEY,
    solicitud_id TEXT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    unidad_medida TEXT NOT NULL,
    observacion TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS actas (
    id TEXT PRIMARY KEY,
    numero TEXT UNIQUE NOT NULL,
    solicitud_id TEXT REFERENCES solicitudes(id) ON DELETE SET NULL,
    es_salida_directa BOOLEAN NOT NULL DEFAULT false,
    oficina_id TEXT NOT NULL REFERENCES oficinas(id),
    destinatario TEXT NOT NULL DEFAULT '',
    fecha TIMESTAMPTZ NOT NULL,
    concepto TEXT NOT NULL DEFAULT '',
    ejecutada BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS acta_items (
    id TEXT PRIMARY KEY,
    acta_id TEXT NOT NULL REFERENCES actas(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    unidad_medida TEXT NOT NULL,
    observacion TEXT NOT NULL DEFAULT '',
    solicitud_item_id TEXT
);

-- ============================================================================
-- 17. KÁRDEX Y MOVIMIENTOS HISTÓRICOS INMUTABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS kardex_movimientos (
    id TEXT PRIMARY KEY,
    producto_id TEXT NOT NULL REFERENCES productos(id),
    fecha TIMESTAMPTZ NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    entradas NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    salidas NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    stock_saldo NUMERIC(14, 4) NOT NULL,
    unidad_medida TEXT NOT NULL,
    destinatario TEXT NOT NULL DEFAULT '',
    oficina_id TEXT REFERENCES oficinas(id) ON DELETE SET NULL,
    acta_id TEXT,
    acta_item_id TEXT,
    solicitud_id TEXT,
    solicitud_item_id TEXT,
    numero_referencia TEXT NOT NULL,
    concepto TEXT NOT NULL,
    usuario TEXT NOT NULL,
    es_auditoria BOOLEAN NOT NULL DEFAULT false,
    estado_auditoria TEXT NOT NULL DEFAULT 'NORMAL' CHECK (estado_auditoria IN ('NORMAL', 'EN_AUDITORIA', 'OBSERVADO')),
    origen TEXT NOT NULL CHECK (origen IN ('MANUAL', 'SOLICITUD', 'SALIDA_DIRECTA', 'EXCEL', 'FACTURA', 'COMPRA', 'AJUSTE')),
    idempotency_key TEXT UNIQUE,
    secuencia BIGINT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    costo_unitario NUMERIC(12, 2),
    valor_entrada NUMERIC(12, 2),
    valor_salida NUMERIC(12, 2),
    saldo_valorado NUMERIC(14, 2)
);

CREATE INDEX IF NOT EXISTS idx_kardex_producto_id ON kardex_movimientos(producto_id);
CREATE INDEX IF NOT EXISTS idx_kardex_fecha ON kardex_movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_kardex_secuencia ON kardex_movimientos(secuencia);
CREATE INDEX IF NOT EXISTS idx_kardex_idempotency_key ON kardex_movimientos(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_kardex_numero_referencia ON kardex_movimientos(numero_referencia);

-- ============================================================================
-- 18. AUDITORÍA DEL SISTEMA
-- ============================================================================
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id TEXT PRIMARY KEY,
    usuario TEXT NOT NULL,
    modulo TEXT NOT NULL,
    accion TEXT NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id TEXT,
    detalles JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_logs_usuario ON auditoria_logs(usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_modulo ON auditoria_logs(modulo);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_creado_en ON auditoria_logs(creado_en);
