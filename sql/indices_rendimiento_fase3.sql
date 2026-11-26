-- ============================================================================
-- FERRETERÍA EMMANUEL — ÍNDICES POSTGRESQL ESTRATÉGICOS (FASE 3 - RENDIMIENTO)
-- ============================================================================
-- ESTE SCRIPT NO HA SIDO EJECUTADO EN NEON / PRODUCCIÓN.
-- DOCUMENTO TÉCNICO PREPARADO PARA REVISIÓN Y FUTURA APLICACIÓN CONTROLADA.
-- ============================================================================
--
-- OBJETIVO:
-- Optimizar el rendimiento de lectura y paginación en PostgreSQL para las consultas
-- de mayor frecuencia de la aplicación (POS, Inventario, Facturación, Cartera y Cotizaciones),
-- transformando operaciones de "Sequential Scan" (O(N)) a "Index Scan / Bitmap Index Scan" (O(log N)).
--
-- PRINCIPIOS DE DISEÑO:
-- 1. Idempotencia total: Se utiliza CREATE INDEX IF NOT EXISTS.
-- 2. Índices compuestos alineados al patrón WHERE + ORDER BY: Permiten resolver
--    el filtrado y la ordenación descendente sin sorts en memoria (Sort Method: quicksort / external merge).
-- 3. Índices parciales donde aplique (WHERE cotizacion_id IS NOT NULL) para reducir el tamaño del índice en disco.
-- 4. Soporte para Batch Fetching (ANY($1)) en tablas hijas (ítems).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COTIZACIONES: FILTRADO POR ESTADO Y ORDEN CRONOLÓGICO
-- ----------------------------------------------------------------------------
-- Consulta objetivo:
--   SELECT ... FROM cotizaciones WHERE estado = $1 ORDER BY fecha DESC LIMIT 20 OFFSET $2;
-- Ganancia esperada:
--   Evita Seq Scan en cotizaciones y sort en memoria. PostgreSQL realiza Index Scan directo
--   recorriendo únicamente las tuplas del estado especificado en orden inverso de fecha.
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado_fecha 
ON cotizaciones (estado, fecha DESC);

-- Índice complementario para el listado general sin filtro de estado:
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha_desc 
ON cotizaciones (fecha DESC);


-- ----------------------------------------------------------------------------
-- 2. FACTURAS: GESTIÓN DE CARTERA POR COBRAR Y CRÉDITOS
-- ----------------------------------------------------------------------------
-- Consulta objetivo (Módulo Cobranza / Cartera):
--   SELECT ... FROM facturas WHERE forma_pago = 'CREDITO' AND estado = 'EMITIDA' ORDER BY fecha DESC;
-- Ganancia esperada:
--   Acelera exponencialmente la pantalla de Cobranza al filtrar directamente sobre el índice B-Tree
--   compuesto, evitando escanear todas las facturas de mostrador (contado, tarjeta, transferencias).
CREATE INDEX IF NOT EXISTS idx_facturas_forma_pago_estado_fecha 
ON facturas (forma_pago, estado, fecha DESC);

-- Consulta objetivo (Listado general de facturas paginado):
--   SELECT ... FROM facturas [WHERE estado = $1] ORDER BY fecha DESC LIMIT 20 OFFSET $2;
CREATE INDEX IF NOT EXISTS idx_facturas_estado_fecha 
ON facturas (estado, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_facturas_fecha_desc 
ON facturas (fecha DESC);


-- ----------------------------------------------------------------------------
-- 3. FACTURAS — TRAZABILIDAD CON COTIZACIÓN ORIGEN
-- ----------------------------------------------------------------------------
-- Consulta objetivo:
--   SELECT ... FROM facturas WHERE cotizacion_id = $1;
-- Ganancia esperada:
--   Índice parcial de bajo peso en disco. Acelera la validación de cotizaciones ya convertidas
--   a factura e impide escaneos secuenciales durante las auditorías de trazabilidad.
CREATE INDEX IF NOT EXISTS idx_facturas_cotizacion_id 
ON facturas (cotizacion_id) 
WHERE cotizacion_id IS NOT NULL;


-- ----------------------------------------------------------------------------
-- 4. ÍTEMS DE FACTURAS Y COTIZACIONES: BATCH FETCHING (ANY($1))
-- ----------------------------------------------------------------------------
-- Nota de Compatibilidad: sql/schema.sql define 'idx_cotizacion_items_cotizacion' y
-- 'idx_factura_items_factura'. Se armonizan los identificadores para prevenir duplicidad
-- de estructuras B-Tree redundantes en disco y memoria RAM.
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion 
ON cotizacion_items (cotizacion_id);

CREATE INDEX IF NOT EXISTS idx_factura_items_factura 
ON factura_items (factura_id);

-- Consulta objetivo (Kárdex y análisis de rotación de producto):
--   SELECT ... FROM cotizacion_items WHERE producto_id = $1;
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_producto 
ON cotizacion_items (producto_id);

CREATE INDEX IF NOT EXISTS idx_factura_items_producto 
ON factura_items (producto_id);


-- ----------------------------------------------------------------------------
-- 5. CATÁLOGO DE PRODUCTOS: ESTADO ACTIVO Y CATEGORÍA (POS / INVENTARIO)
-- ----------------------------------------------------------------------------
-- Consulta objetivo:
--   SELECT ... FROM productos WHERE activo = true AND categoria = $1;
--   SELECT ... FROM productos WHERE activo = true;
-- Ganancia esperada:
--   Optimiza la carga del catálogo activo en la Caja POS y el módulo de inventario,
--   aislando los productos descontinuados o inactivos de las operaciones de venta activa.
CREATE INDEX IF NOT EXISTS idx_productos_activo_categoria 
ON productos (activo, categoria);

-- Búsqueda rápida por código de barras en POS (índice parcial optimizado):
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras_parcial 
ON productos (codigo_barras) 
WHERE codigo_barras IS NOT NULL AND codigo_barras <> '';


-- ----------------------------------------------------------------------------
-- 6. MÓDULO DE COMPRAS, PEDIDOS Y RECEPCIONES: BATCH FETCHING
-- ----------------------------------------------------------------------------
-- Consultas objetivo (Eliminación de N+1 en compras):
--   SELECT ... FROM compra_items WHERE compra_id = ANY($1);
--   SELECT ... FROM pedido_compra_items WHERE pedido_id = ANY($1);
--   SELECT ... FROM recepcion_compra_items WHERE recepcion_id = ANY($1);
--   SELECT ... FROM devolucion_proveedor_items WHERE devolucion_id = ANY($1);
CREATE INDEX IF NOT EXISTS idx_compra_items_compra 
ON compra_items (compra_id);

CREATE INDEX IF NOT EXISTS idx_pedido_compra_items_pedido_id 
ON pedido_compra_items (pedido_id);

CREATE INDEX IF NOT EXISTS idx_recepcion_compra_items_recepcion_id 
ON recepcion_compra_items (recepcion_id);

CREATE INDEX IF NOT EXISTS idx_devolucion_proveedor_items_devolucion_id 
ON devolucion_proveedor_items (devolucion_id);


-- ----------------------------------------------------------------------------
-- 7. CLIENTES Y TRAZABILIDAD POR CLIENTE
-- ----------------------------------------------------------------------------
-- Nota: idx_clientes_identificacion ya existe en schema.sql.
-- Se añade índice compuesto para historial de facturación por cliente en orden inverso:
CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id_fecha 
ON facturas (cliente_id, fecha DESC) 
WHERE cliente_id IS NOT NULL;
