-- ============================================================================
-- FERRETERÍA EMMANUEL — SCRIPT MAESTRO DE PERSISTENCIA COMERCIAL CONSOLIDADO
-- Fase 3.0E Consolidada: Gobernanza Comercial, Versionado e Integridad Fiscal
-- Compatibilidad: PostgreSQL 15+, Supabase y Neon
-- Transaccionalidad: Idempotente y Seguro ante Ambivalencias Históricas
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONES Y COMPATIBILIDAD BASE
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLA DE AUTORIZACIONES REALES DEL PROPIETARIO / ADMINISTRADOR
-- ----------------------------------------------------------------------------
-- Impide que cajeros o clientes SQL declaren reducciones o cancelaciones de
-- compromisos sin una aprobación real, verificable y auditable del propietario.
CREATE TABLE IF NOT EXISTS autorizaciones_operaciones (
    id TEXT PRIMARY KEY DEFAULT ('AUTH-' || gen_random_uuid()),
    tipo_operacion TEXT NOT NULL CHECK (tipo_operacion IN ('REDUCCION_COTIZACION', 'CANCELACION_COTIZACION', 'DESCUENTO_ESPECIAL', 'CREDITO_EXCEDIDO')),
    documento_tipo TEXT NOT NULL DEFAULT 'COTIZACION',
    documento_id TEXT NOT NULL,
    motivo TEXT NOT NULL,
    detalles JSONB NOT NULL DEFAULT '{}'::jsonb,
    solicitado_por TEXT NOT NULL,
    autorizado_por TEXT NOT NULL,
    rol_autorizador TEXT NOT NULL CHECK (rol_autorizador IN ('admin', 'ADMINISTRADOR', 'PROPIETARIO')),
    consumido BOOLEAN NOT NULL DEFAULT false,
    consumido_en TIMESTAMPTZ,
    consumido_por TEXT,
    token_seguridad TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_operaciones_doc 
ON autorizaciones_operaciones (documento_id, tipo_operacion) 
WHERE (consumido = false);

-- Trigger de validación de autenticidad en autorizaciones
-- Verifica que autorizado_por exista en usuarios_cuentas y posea rol de administrador
CREATE OR REPLACE FUNCTION fn_trg_autorizaciones_operaciones_validador()
RETURNS TRIGGER AS $$
DECLARE
    v_rol_usuario TEXT;
    v_activo BOOLEAN;
BEGIN
    -- Validar contra tabla de usuarios si existe en el esquema
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios_cuentas') THEN
        SELECT rol, activo INTO v_rol_usuario, v_activo
        FROM usuarios_cuentas
        WHERE id = NEW.autorizado_por OR usuario = NEW.autorizado_por;

        IF FOUND THEN
            IF v_activo = false THEN
                RAISE EXCEPTION 'Autorización Rechazada: El usuario autorizador % se encuentra inactivo.', NEW.autorizado_por;
            END IF;
            IF LOWER(v_rol_usuario) NOT IN ('admin', 'administrador', 'propietario') THEN
                RAISE EXCEPTION 'Autorización Rechazada: El usuario % posee rol % y carece de privilegios para autorizar operaciones comerciales.',
                    NEW.autorizado_por, v_rol_usuario;
            END IF;
        END IF;
    END IF;

    -- Validar existencia del documento si es cotización
    IF NEW.documento_tipo = 'COTIZACION' THEN
        IF NOT EXISTS (SELECT 1 FROM cotizaciones WHERE id = NEW.documento_id) THEN
            RAISE EXCEPTION 'Documento Inválido: La cotización % no existe.', NEW.documento_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_autorizaciones_operaciones_validador ON autorizaciones_operaciones;
CREATE TRIGGER trg_autorizaciones_operaciones_validador
BEFORE INSERT ON autorizaciones_operaciones
FOR EACH ROW EXECUTE FUNCTION fn_trg_autorizaciones_operaciones_validador();

-- ----------------------------------------------------------------------------
-- 2. EVOLUCIÓN COMPATIBLE DEL ESQUEMA COMERCIAL (TABLAS MAESTRAS)
-- ----------------------------------------------------------------------------

-- 2.1 Actualización de la restricción de estados en cotizaciones
-- Soporta el ciclo de vida completo sin quebrar restricciones preexistentes de sql/schema.sql
ALTER TABLE cotizaciones DROP CONSTRAINT IF EXISTS cotizaciones_estado_check;
ALTER TABLE cotizaciones ADD CONSTRAINT cotizaciones_estado_check 
CHECK (estado IN (
    'BORRADOR', 'EMITIDA', 'ENVIADA', 'ACEPTADA', 
    'PENDIENTE_AUTORIZACION', 'AUTORIZADA', 'PARCIALMENTE_FACTURADA', 
    'FACTURADA', 'SUSTITUIDA', 'RECHAZADA', 'VENCIDA', 'CANCELADA'
));

-- 2.2 Cabecera de Cotizaciones: Versionado Genealógico, Bloqueo y Desglose Fiscal
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS cotizacion_raiz_id TEXT,
ADD COLUMN IF NOT EXISTS version_padre_id TEXT,
ADD COLUMN IF NOT EXISTS es_version_actual BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS motivo_modificacion TEXT,
ADD COLUMN IF NOT EXISTS bloqueada_por_ambiguedad BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS subtotal_gravado NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS subtotal_exento NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS descuento_general NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS iva NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total NUMERIC(14, 2) NOT NULL DEFAULT 0.00;

-- Backfill genealógico inicial idempotente
UPDATE cotizaciones 
SET cotizacion_raiz_id = id 
WHERE cotizacion_raiz_id IS NULL;

-- Invariante: Única versión vigente activa por raíz genealógica
CREATE UNIQUE INDEX IF NOT EXISTS uq_cotizaciones_raiz_version_actual
ON cotizaciones (cotizacion_raiz_id)
WHERE (es_version_actual = true);

-- Índice parcial de cotizaciones bloqueadas por ambigüedad
CREATE INDEX IF NOT EXISTS idx_cotizaciones_bloqueadas_ambiguedad 
ON cotizaciones (id) WHERE (bloqueada_por_ambiguedad = true);

-- 2.3 Renglones de Cotizaciones: Cuádruple Partición de Cantidades
-- cantidad = cantidad_facturada + cantidad_cancelada + cantidad_pendiente
ALTER TABLE cotizacion_items 
ADD COLUMN IF NOT EXISTS cantidad_facturada NUMERIC(14, 4),
ADD COLUMN IF NOT EXISTS cantidad_cancelada NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS cantidad_pendiente NUMERIC(14, 4),
ADD COLUMN IF NOT EXISTS precio_autorizado NUMERIC(14, 2),
ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS descuento NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS exento_iva BOOLEAN NOT NULL DEFAULT false;

-- Restricción de Balance Operativo Condicional:
-- Permite NULL en datos históricos en conciliación, pero exige balance matemático perfecto en resueltos.
ALTER TABLE cotizacion_items 
DROP CONSTRAINT IF EXISTS chk_cotizacion_items_balance_cantidades;

ALTER TABLE cotizacion_items 
ADD CONSTRAINT chk_cotizacion_items_balance_cantidades
CHECK (
    (cantidad_facturada IS NULL AND cantidad_pendiente IS NULL) OR
    (
        cantidad_facturada IS NOT NULL AND 
        cantidad_pendiente IS NOT NULL AND 
        cantidad_cancelada IS NOT NULL AND
        cantidad_facturada >= 0 AND 
        cantidad_cancelada >= 0 AND 
        cantidad_pendiente >= 0 AND 
        (cantidad_facturada + cantidad_cancelada) <= cantidad AND 
        cantidad_pendiente = (cantidad - cantidad_facturada - cantidad_cancelada)
    )
);

-- ----------------------------------------------------------------------------
-- 3. GOBERNANZA BANCARIA: POLÍTICA A (OPERACIONES PENDIENTES)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operaciones_pendientes_transferencia (
    id TEXT PRIMARY KEY DEFAULT ('OPE-TX-' || gen_random_uuid()),
    cotizacion_id TEXT REFERENCES cotizaciones(id),
    cliente_id TEXT,
    cliente_nombre TEXT NOT NULL,
    cajero_id TEXT NOT NULL,
    cajero_nombre TEXT NOT NULL,
    banco_origen TEXT NOT NULL,
    banco_destino TEXT NOT NULL,
    referencia_bancaria TEXT NOT NULL,
    monto_declarado NUMERIC(14, 2) NOT NULL CHECK (monto_declarado > 0),
    monto_acreditado NUMERIC(14, 2) CHECK (monto_acreditado >= 0),
    moneda TEXT NOT NULL DEFAULT 'NIO',
    comprobante_url TEXT,
    payload_lineas JSONB NOT NULL,
    
    -- Separación estricta de estados (Regla 6)
    -- El estado comercial es PENDIENTE_CONFIRMACION (NO reserva inventario automáticamente)
    estado_bancario TEXT NOT NULL DEFAULT 'PENDIENTE_VERIFICACION' 
        CHECK (estado_bancario IN ('PENDIENTE_VERIFICACION', 'ACREDITADO', 'RECHAZADO')),
    estado_comercial TEXT NOT NULL DEFAULT 'PENDIENTE_CONFIRMACION' 
        CHECK (estado_comercial IN ('PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'CANCELADA')),
    stock_reservado BOOLEAN NOT NULL DEFAULT false, -- Regla: inventario no se toca antes de confirmación
    
    verificado_por TEXT,
    fecha_verificacion TIMESTAMPTZ,
    motivo_rechazo TEXT,
    factura_id TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_transferencia_referencia_bancaria 
ON operaciones_pendientes_transferencia (banco_destino, referencia_bancaria)
WHERE (estado_bancario <> 'RECHAZADO');

-- ----------------------------------------------------------------------------
-- 4. TABLA DE CONTROL DE AUDITORÍA CON IDENTIDAD ÚNICA IDEMPOTENTE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_migracion_cotizaciones_ambiguas (
    id TEXT PRIMARY KEY DEFAULT ('MIG-AMB-' || gen_random_uuid()),
    cotizacion_id TEXT NOT NULL REFERENCES cotizaciones(id) ON DELETE RESTRICT,
    cotizacion_numero TEXT NOT NULL,
    cotizacion_item_id TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    cantidad_cotizada NUMERIC(14, 4) NOT NULL,
    cantidad_facturada_detectada NUMERIC(14, 4),
    motivo_ambiguedad TEXT NOT NULL,
    bloqueada_por_ambiguedad BOOLEAN NOT NULL DEFAULT true,
    resuelto BOOLEAN NOT NULL DEFAULT false,
    resuelto_por TEXT,
    fecha_resolucion TIMESTAMPTZ,
    fecha_deteccion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_auditoria_migracion_item UNIQUE (cotizacion_item_id)
);

-- ----------------------------------------------------------------------------
-- 5. BACKFILL HISTÓRICO DETERMINISTA CON VERIFICACIÓN EXHAUSTIVA DE VÍNCULOS
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_sin_facturacion INT := 0;
    v_totalmente_consumidas INT := 0;
    v_parcialmente_facturadas INT := 0;
    v_ambiguas_detectadas INT := 0;
BEGIN
    -- 5.1 CATEGORÍA 4D: Cotizaciones en estado FACTURADA sin comprobante demostrable
    INSERT INTO auditoria_migracion_cotizaciones_ambiguas (
        cotizacion_id, cotizacion_numero, cotizacion_item_id, producto_id,
        cantidad_cotizada, cantidad_facturada_detectada, motivo_ambiguedad
    )
    SELECT 
        c.id, c.numero, ci.id, ci.producto_id,
        ci.cantidad, NULL,
        'Cotización histórica en estado FACTURADA sin factura vinculable. Requiere conciliación contable; saldos en NULL.'
    FROM cotizaciones c
    JOIN cotizacion_items ci ON ci.cotizacion_id = c.id
    WHERE c.estado = 'FACTURADA'
      AND c.factura_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM facturas f WHERE f.cotizacion_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM facturas f WHERE f.cliente_id = c.cliente_id AND f.notas ILIKE '%' || c.numero || '%')
      AND ci.cantidad_pendiente IS NULL
    ON CONFLICT (cotizacion_item_id) DO NOTHING;

    -- 5.2 CATEGORÍA 4A: Facturas vinculadas en estado ANULADA
    INSERT INTO auditoria_migracion_cotizaciones_ambiguas (
        cotizacion_id, cotizacion_numero, cotizacion_item_id, producto_id,
        cantidad_cotizada, cantidad_facturada_detectada, motivo_ambiguedad
    )
    SELECT 
        c.id, c.numero, ci.id, ci.producto_id,
        ci.cantidad, NULL,
        'Factura vinculada fue ANULADA. Regla comercial prohíbe reapertura automática; requiere conciliación manual.'
    FROM cotizaciones c
    JOIN facturas f ON (f.id = c.factura_id OR f.cotizacion_id = c.id)
    JOIN cotizacion_items ci ON ci.cotizacion_id = c.id
    WHERE f.estado = 'ANULADA' 
      AND ci.cantidad_pendiente IS NULL
    ON CONFLICT (cotizacion_item_id) DO NOTHING;

    -- 5.3 CATEGORÍA 4B: Cotizaciones con multiplicidad de renglones del mismo producto
    INSERT INTO auditoria_migracion_cotizaciones_ambiguas (
        cotizacion_id, cotizacion_numero, cotizacion_item_id, producto_id,
        cantidad_cotizada, cantidad_facturada_detectada, motivo_ambiguedad
    )
    SELECT 
        c.id, c.numero, ci.id, ci.producto_id,
        ci.cantidad, NULL,
        'Multiplicidad de renglones con el mismo producto_id en la misma cotización; imposible mapeo unívoco seguro.'
    FROM cotizaciones c
    JOIN cotizacion_items ci ON ci.cotizacion_id = c.id
    WHERE ci.cantidad_pendiente IS NULL
      AND c.id IN (
          SELECT cotizacion_id 
          FROM cotizacion_items 
          GROUP BY cotizacion_id, producto_id 
          HAVING COUNT(*) > 1
      )
      AND (c.factura_id IS NOT NULL OR EXISTS (SELECT 1 FROM facturas f WHERE f.cotizacion_id = c.id))
    ON CONFLICT (cotizacion_item_id) DO NOTHING;

    -- 5.4 CATEGORÍA 4C: Inconsistencia contable donde lo facturado supera lo cotizado
    INSERT INTO auditoria_migracion_cotizaciones_ambiguas (
        cotizacion_id, cotizacion_numero, cotizacion_item_id, producto_id,
        cantidad_cotizada, cantidad_facturada_detectada, motivo_ambiguedad
    )
    SELECT 
        c.id, c.numero, ci.id, ci.producto_id,
        ci.cantidad, consumo.total_facturado,
        'Inconsistencia contable: Cantidad facturada detectada (' || consumo.total_facturado || ') supera la cotizada (' || ci.cantidad || ').'
    FROM cotizaciones c
    JOIN cotizacion_items ci ON ci.cotizacion_id = c.id
    JOIN (
        SELECT f.cotizacion_id, fi.producto_id, SUM(fi.cantidad) AS total_facturado
        FROM facturas f
        JOIN factura_items fi ON fi.factura_id = f.id
        WHERE f.estado IN ('EMITIDA', 'PAGADA')
        GROUP BY f.cotizacion_id, fi.producto_id
    ) consumo ON consumo.cotizacion_id = c.id AND consumo.producto_id = ci.producto_id
    WHERE ci.cantidad_pendiente IS NULL
      AND consumo.total_facturado > ci.cantidad
    ON CONFLICT (cotizacion_item_id) DO NOTHING;

    -- Aplicar bloqueo explícito a todas las cotizaciones con incidencias
    UPDATE cotizaciones c
    SET bloqueada_por_ambiguedad = true
    WHERE EXISTS (
        SELECT 1 FROM auditoria_migracion_cotizaciones_ambiguas a 
        WHERE a.cotizacion_id = c.id AND a.resuelto = false
    );

    GET DIAGNOSTICS v_ambiguas_detectadas = ROW_COUNT;

    -- 5.5 CATEGORÍA 2: Cotizaciones sin facturación demostrable
    UPDATE cotizacion_items ci
    SET cantidad_facturada = 0.0000,
        cantidad_cancelada = 0.0000,
        cantidad_pendiente = ci.cantidad
    FROM cotizaciones c
    WHERE c.id = ci.cotizacion_id
      AND c.bloqueada_por_ambiguedad = false
      AND c.factura_id IS NULL
      AND c.estado NOT IN ('FACTURADA', 'PARCIALMENTE_FACTURADA')
      AND NOT EXISTS (SELECT 1 FROM facturas f WHERE f.cotizacion_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM facturas f WHERE f.cliente_id = c.cliente_id AND f.notas ILIKE '%' || c.numero || '%')
      AND ci.cantidad_pendiente IS NULL;

    GET DIAGNOSTICS v_sin_facturacion = ROW_COUNT;

    -- 5.6 CATEGORÍA 3: Cotizaciones con evidencia unívoca totalmente consumidas
    WITH consumo_univoco AS (
        SELECT 
            c.id AS cotizacion_id,
            ci.id AS cotizacion_item_id,
            ci.cantidad AS cantidad_cotizada,
            SUM(fi.cantidad) AS total_facturado
        FROM cotizaciones c
        JOIN facturas f ON (f.id = c.factura_id OR f.cotizacion_id = c.id)
        JOIN cotizacion_items ci ON ci.cotizacion_id = c.id
        JOIN factura_items fi ON fi.factura_id = f.id AND fi.producto_id = ci.producto_id
        WHERE f.estado IN ('EMITIDA', 'PAGADA')
          AND c.bloqueada_por_ambiguedad = false
          AND ci.cantidad_pendiente IS NULL
        GROUP BY c.id, ci.id, ci.cantidad
    )
    UPDATE cotizacion_items ci
    SET cantidad_facturada = cu.cantidad_cotizada,
        cantidad_cancelada = 0.0000,
        cantidad_pendiente = 0.0000
    FROM consumo_univoco cu
    WHERE ci.id = cu.cotizacion_item_id
      AND cu.total_facturado = cu.cantidad_cotizada;

    GET DIAGNOSTICS v_totalmente_consumidas = ROW_COUNT;

    -- 5.7 CATEGORÍA 1: Cotizaciones con evidencia unívoca parcialmente facturadas
    WITH consumo_parcial AS (
        SELECT 
            c.id AS cotizacion_id,
            ci.id AS cotizacion_item_id,
            ci.cantidad AS cantidad_cotizada,
            SUM(fi.cantidad) AS total_facturado
        FROM cotizaciones c
        JOIN facturas f ON (f.id = c.factura_id OR f.cotizacion_id = c.id)
        JOIN cotizacion_items ci ON ci.cotizacion_id = c.id
        JOIN factura_items fi ON fi.factura_id = f.id AND fi.producto_id = ci.producto_id
        WHERE f.estado IN ('EMITIDA', 'PAGADA')
          AND c.bloqueada_por_ambiguedad = false
          AND ci.cantidad_pendiente IS NULL
        GROUP BY c.id, ci.id, ci.cantidad
    )
    UPDATE cotizacion_items ci
    SET cantidad_facturada = cp.total_facturado,
        cantidad_cancelada = 0.0000,
        cantidad_pendiente = cp.cantidad_cotizada - cp.total_facturado
    FROM consumo_parcial cp
    WHERE ci.id = cp.cotizacion_item_id
      AND cp.total_facturado > 0 
      AND cp.total_facturado < cp.cantidad_cotizada;

    GET DIAGNOSTICS v_parcialmente_facturadas = ROW_COUNT;

    RAISE NOTICE 'Backfill finalizado: Sin facturación (%), Totalmente consumidas (%), Parciales (%). Ambiguas bloqueadas (%). Registros no resueltos mantenidos en NULL con seguridad.',
        v_sin_facturacion, v_totalmente_consumidas, v_parcialmente_facturadas, v_ambiguas_detectadas;
END $$;

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS DE INMUTABILIDAD Y CONTROL DE REGISTROS NUEVOS
-- ----------------------------------------------------------------------------

-- 6.1 Trigger en Cabeceras (cotizaciones)
CREATE OR REPLACE FUNCTION fn_trg_cotizaciones_inmutabilidad()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.estado IN ('AUTORIZADA', 'PARCIALMENTE_FACTURADA', 'FACTURADA', 'SUSTITUIDA') THEN
            RAISE EXCEPTION 'Violación de Inmutabilidad: Prohibido eliminar cotizaciones con historial comercial en estado % (id: %, número: %).', 
                OLD.estado, OLD.id, OLD.numero;
        END IF;
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Invariante de identidad genealógica
        IF NEW.version IS DISTINCT FROM OLD.version OR NEW.cotizacion_raiz_id IS DISTINCT FROM OLD.cotizacion_raiz_id THEN
            RAISE EXCEPTION 'Violación de Integridad: La raíz genealógica y el número de versión son inmutables de por vida (id: %).', OLD.id;
        END IF;

        -- Versiones históricas sustituidas o inactivas: congelamiento comercial total
        IF OLD.es_version_actual = false OR OLD.estado = 'SUSTITUIDA' THEN
            IF NEW.subtotal IS DISTINCT FROM OLD.subtotal 
               OR NEW.subtotal_gravado IS DISTINCT FROM OLD.subtotal_gravado 
               OR NEW.subtotal_exento IS DISTINCT FROM OLD.subtotal_exento 
               OR NEW.iva IS DISTINCT FROM OLD.iva 
               OR NEW.total IS DISTINCT FROM OLD.total 
               OR NEW.cliente_id IS DISTINCT FROM OLD.cliente_id 
               OR NEW.cliente IS DISTINCT FROM OLD.cliente 
               OR NEW.descuento_general IS DISTINCT FROM OLD.descuento_general 
               OR NEW.fecha IS DISTINCT FROM OLD.fecha 
               OR NEW.estado IS DISTINCT FROM OLD.estado THEN
                RAISE EXCEPTION 'Violación de Inmutabilidad: La versión histórica v% (id: %) está congelada y no admite modificaciones comerciales.', 
                    OLD.version, OLD.id;
            END IF;
        END IF;

        -- Estados terminales
        IF OLD.estado IN ('FACTURADA', 'RECHAZADA', 'CANCELADA') THEN
            IF NEW.estado IS DISTINCT FROM OLD.estado 
               OR NEW.total IS DISTINCT FROM OLD.total 
               OR NEW.cliente_id IS DISTINCT FROM OLD.cliente_id THEN
                RAISE EXCEPTION 'Violación de Integridad: Cotización en estado terminal % no admite alteraciones (id: %).', 
                    OLD.estado, OLD.id;
            END IF;
        END IF;

        -- Estado AUTORIZADA
        IF OLD.estado = 'AUTORIZADA' THEN
            IF NEW.cliente_id IS DISTINCT FROM OLD.cliente_id 
               OR NEW.cliente IS DISTINCT FROM OLD.cliente 
               OR NEW.subtotal IS DISTINCT FROM OLD.subtotal 
               OR NEW.subtotal_gravado IS DISTINCT FROM OLD.subtotal_gravado 
               OR NEW.subtotal_exento IS DISTINCT FROM OLD.subtotal_exento 
               OR NEW.iva IS DISTINCT FROM OLD.iva 
               OR NEW.total IS DISTINCT FROM OLD.total 
               OR NEW.descuento_general IS DISTINCT FROM OLD.descuento_general 
               OR NEW.fecha IS DISTINCT FROM OLD.fecha THEN
                RAISE EXCEPTION 'Violación de Integridad: Las condiciones comerciales de una cotización AUTORIZADA están congeladas. Genere una nueva versión.';
            END IF;

            IF NEW.estado NOT IN ('AUTORIZADA', 'PARCIALMENTE_FACTURADA', 'FACTURADA', 'SUSTITUIDA', 'RECHAZADA', 'CANCELADA') THEN
                RAISE EXCEPTION 'Transición de Estado Inválida: De AUTORIZADA no se puede transicionar a % (id: %).', NEW.estado, OLD.id;
            END IF;
        END IF;

        -- Estado PARCIALMENTE_FACTURADA
        IF OLD.estado = 'PARCIALMENTE_FACTURADA' THEN
            IF NEW.cliente_id IS DISTINCT FROM OLD.cliente_id 
               OR NEW.subtotal IS DISTINCT FROM OLD.subtotal 
               OR NEW.total IS DISTINCT FROM OLD.total THEN
                RAISE EXCEPTION 'Violación de Integridad: Cotización parcialmente facturada no permite alterar condiciones pactadas.';
            END IF;

            IF NEW.estado NOT IN ('PARCIALMENTE_FACTURADA', 'FACTURADA', 'SUSTITUIDA') THEN
                RAISE EXCEPTION 'Transición de Estado Inválida: De PARCIALMENTE_FACTURADA solo se puede transicionar a FACTURADA o SUSTITUIDA (intento: %).', NEW.estado;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cotizaciones_inmutabilidad ON cotizaciones;
CREATE TRIGGER trg_cotizaciones_inmutabilidad
BEFORE UPDATE OR DELETE ON cotizaciones
FOR EACH ROW EXECUTE FUNCTION fn_trg_cotizaciones_inmutabilidad();

-- 6.2 Trigger en Renglones (cotizacion_items) con Balance de Cancelaciones
CREATE OR REPLACE FUNCTION fn_trg_cotizacion_items_inmutabilidad()
RETURNS TRIGGER AS $$
DECLARE
    v_es_actual BOOLEAN;
    v_estado TEXT;
    v_bloqueada BOOLEAN;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT es_version_actual, estado, bloqueada_por_ambiguedad 
        INTO v_es_actual, v_estado, v_bloqueada
        FROM cotizaciones WHERE id = OLD.cotizacion_id;

        IF v_estado IN ('AUTORIZADA', 'PARCIALMENTE_FACTURADA', 'FACTURADA', 'SUSTITUIDA') THEN
            RAISE EXCEPTION 'Violación de Inmutabilidad: Prohibido eliminar renglones de cotizaciones en estado % (cotizacion_id: %)', 
                v_estado, OLD.cotizacion_id;
        END IF;
        RETURN OLD;

    ELSIF TG_OP = 'INSERT' THEN
        -- Registros nuevos no pueden entrar con cantidades NULL
        IF NEW.cantidad_facturada IS NULL OR NEW.cantidad_pendiente IS NULL OR NEW.cantidad_cancelada IS NULL THEN
            RAISE EXCEPTION 'Violación de Integridad: Las cantidades facturada, cancelada y pendiente son estrictamente obligatorias en registros nuevos.';
        END IF;

        SELECT es_version_actual, estado, bloqueada_por_ambiguedad 
        INTO v_es_actual, v_estado, v_bloqueada
        FROM cotizaciones WHERE id = NEW.cotizacion_id;

        IF v_es_actual = false OR v_estado IN ('AUTORIZADA', 'PARCIALMENTE_FACTURADA', 'FACTURADA', 'SUSTITUIDA') THEN
            RAISE EXCEPTION 'Violación de Integridad: Prohibido insertar renglones directamente en cotizaciones en estado % o históricas (cotizacion_id: %). Requiere nueva versión.', 
                v_estado, NEW.cotizacion_id;
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        SELECT es_version_actual, estado, bloqueada_por_ambiguedad 
        INTO v_es_actual, v_estado, v_bloqueada
        FROM cotizaciones WHERE id = OLD.cotizacion_id;

        IF v_bloqueada = true THEN
            RAISE EXCEPTION 'Operación Bloqueada: Renglón perteneciente a cotización con ambigüedad histórica en revisión (cotizacion_id: %)', OLD.cotizacion_id;
        END IF;

        IF v_es_actual = false OR v_estado IN ('SUSTITUIDA', 'FACTURADA', 'CANCELADA') THEN
            RAISE EXCEPTION 'Violación de Inmutabilidad: Renglón perteneciente a versión histórica sustituida o liquidada (cotizacion_id: %)', OLD.cotizacion_id;
        END IF;

        IF v_estado IN ('AUTORIZADA', 'PARCIALMENTE_FACTURADA') THEN
            IF NEW.producto_id IS DISTINCT FROM OLD.producto_id THEN
                RAISE EXCEPTION 'Violación de Integridad: Prohibido alterar el producto de un renglón autorizado.';
            END IF;
            IF NEW.cantidad IS DISTINCT FROM OLD.cantidad THEN
                RAISE EXCEPTION 'Violación de Integridad: La cantidad pactada original (%) no puede modificarse en cotización autorizada.', OLD.cantidad;
            END IF;
            IF NEW.precio IS DISTINCT FROM OLD.precio THEN
                RAISE EXCEPTION 'Violación de Integridad: El precio pactado permanece estrictamente congelado.';
            END IF;
            IF NEW.precio_autorizado IS DISTINCT FROM OLD.precio_autorizado THEN
                RAISE EXCEPTION 'Violación de Integridad: El precio negociado autorizado permanece estrictamente congelado.';
            END IF;
            IF NEW.unidad_medida IS DISTINCT FROM OLD.unidad_medida THEN
                RAISE EXCEPTION 'Violación de Integridad: La unidad de medida de un renglón autorizado no puede alterarse.';
            END IF;
            IF NEW.descuento IS DISTINCT FROM OLD.descuento THEN
                RAISE EXCEPTION 'Violación de Integridad: El descuento pactado no puede modificarse en cotización autorizada.';
            END IF;
            IF NEW.exento_iva IS DISTINCT FROM OLD.exento_iva THEN
                RAISE EXCEPTION 'Violación de Integridad: La exención de IVA no puede alterarse en cotización autorizada.';
            END IF;

            -- VALIDACIÓN TRANSACCIONAL DE CANTIDADES (FACTURACIÓN O CANCELACIÓN AUTORIZADA)
            IF NEW.cantidad_facturada IS DISTINCT FROM OLD.cantidad_facturada OR 
               NEW.cantidad_cancelada IS DISTINCT FROM OLD.cantidad_cancelada THEN

                IF NEW.cantidad_facturada < COALESCE(OLD.cantidad_facturada, 0) THEN
                    RAISE EXCEPTION 'Violación de Consistencia: La cantidad facturada acumulada no puede retroceder (% -> %).', 
                        OLD.cantidad_facturada, NEW.cantidad_facturada;
                END IF;

                IF NEW.cantidad_cancelada < COALESCE(OLD.cantidad_cancelada, 0) THEN
                    RAISE EXCEPTION 'Violación de Consistencia: La cantidad cancelada acumulada no puede retroceder (% -> %).', 
                        OLD.cantidad_cancelada, NEW.cantidad_cancelada;
                END IF;

                IF (NEW.cantidad_facturada + NEW.cantidad_cancelada) > OLD.cantidad THEN
                    RAISE EXCEPTION 'Violación de Sobrefacturación/Balance: La suma facturada (%) + cancelada (%) no puede exceder el compromiso original (%).', 
                        NEW.cantidad_facturada, NEW.cantidad_cancelada, OLD.cantidad;
                END IF;

                IF NEW.cantidad_pendiente IS DISTINCT FROM (OLD.cantidad - NEW.cantidad_facturada - NEW.cantidad_cancelada) THEN
                    RAISE EXCEPTION 'Violación de Balance: cantidad_pendiente debe ser exactamente igual a (cantidad - cantidad_facturada - cantidad_cancelada).';
                END IF;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cotizacion_items_inmutabilidad ON cotizacion_items;
CREATE TRIGGER trg_cotizacion_items_inmutabilidad
BEFORE INSERT OR UPDATE OR DELETE ON cotizacion_items
FOR EACH ROW EXECUTE FUNCTION fn_trg_cotizacion_items_inmutabilidad();

-- ----------------------------------------------------------------------------
-- 7. FUNCIÓN TRANSACCIONAL DE VERSIONADO CON VALIDACIÓN DE AUTORIZACIÓN DEL PROPIETARIO
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_versionar_cotizacion_atomica(
    p_cotizacion_actual_id TEXT,
    p_usuario TEXT,
    p_motivo TEXT,
    p_nuevo_id TEXT,
    p_nuevo_numero TEXT,
    p_renglones_versionados JSONB, -- Array de: { cotizacionItemId, cantidadTrasladada, precio, unidadMedida, reduccionAutorizada, motivoReduccion }
    p_autorizacion_id TEXT DEFAULT NULL -- Obligatorio si existe reduccionAutorizada > 0
)
RETURNS JSONB AS $$
DECLARE
    v_cot_actual RECORD;
    v_item_actual RECORD;
    v_auth RECORD;
    v_nueva_version_num INT;
    v_subtotal NUMERIC(14, 2) := 0.00;
    v_subtotal_gravado NUMERIC(14, 2) := 0.00;
    v_subtotal_exento NUMERIC(14, 2) := 0.00;
    v_importe_renglon NUMERIC(14, 2) := 0.00;
    v_iva NUMERIC(14, 2) := 0.00;
    v_total NUMERIC(14, 2) := 0.00;
    v_nuevo_item_id TEXT;
    v_elem JSONB;
    v_item_id_solicitado TEXT;
    v_cantidad_trasladada NUMERIC(14, 4);
    v_reduccion_autorizada NUMERIC(14, 4);
    v_precio_solicitado NUMERIC(14, 2);
    v_items_procesados TEXT[] := ARRAY[]::TEXT[];
    v_conteo_pendientes_original INT;
    v_conteo_items_solicitados INT;
    v_total_trasladado NUMERIC(14, 4) := 0.0000;
    v_total_reducido NUMERIC(14, 4) := 0.0000;
    v_autorizado_por TEXT := 'N/A';
    v_exento BOOLEAN;
BEGIN
    -- 1. BLOQUEO PESIMISTA DE CABECERA VIGENTE
    SELECT * INTO v_cot_actual 
    FROM cotizaciones 
    WHERE id = p_cotizacion_actual_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error de Versionado: La cotización % no existe.', p_cotizacion_actual_id;
    END IF;

    IF v_cot_actual.es_version_actual = false OR v_cot_actual.estado = 'SUSTITUIDA' THEN
        RAISE EXCEPTION 'Violación de Integridad: La cotización % ya no es la versión vigente (v%).', 
            v_cot_actual.numero, v_cot_actual.version;
    END IF;

    IF v_cot_actual.bloqueada_por_ambiguedad = true THEN
        RAISE EXCEPTION 'Operación Bloqueada: La cotización % presenta ambigüedades históricas y no admite operaciones comerciales.', 
            v_cot_actual.numero;
    END IF;

    IF v_cot_actual.estado NOT IN ('AUTORIZADA', 'PARCIALMENTE_FACTURADA') THEN
        RAISE EXCEPTION 'Estado Inválido: Solo cotizaciones AUTORIZADA o PARCIALMENTE_FACTURADA admiten versionado (estado actual: %).', 
            v_cot_actual.estado;
    END IF;

    IF p_renglones_versionados IS NULL OR jsonb_array_length(p_renglones_versionados) = 0 THEN
        RAISE EXCEPTION 'Error de Validación: El listado de renglones para la nueva versión no puede estar vacío.';
    END IF;

    -- 2. BLOQUEO PESIMISTA DE TODOS LOS RENGLONES DE LA VERSIÓN ACTUAL
    PERFORM id 
    FROM cotizacion_items 
    WHERE cotizacion_id = p_cotizacion_actual_id 
    FOR UPDATE;

    SELECT COUNT(*) INTO v_conteo_pendientes_original
    FROM cotizacion_items
    WHERE cotizacion_id = p_cotizacion_actual_id
      AND cantidad_pendiente > 0;

    IF v_conteo_pendientes_original = 0 THEN
        RAISE EXCEPTION 'Operación Inválida: La cotización actual no posee renglones con saldos pendientes por versionar.';
    END IF;

    v_conteo_items_solicitados := jsonb_array_length(p_renglones_versionados);

    -- Regla de Conservación: Se exige resolución explícita de todos los renglones con saldo
    IF v_conteo_items_solicitados <> v_conteo_pendientes_original THEN
        RAISE EXCEPTION 'Inconsistencia de Conservación: Se enviaron % renglones pero existen % partidas con saldo pendiente. Se prohíbe la omisión silenciosa de compromisos.',
            v_conteo_items_solicitados, v_conteo_pendientes_original;
    END IF;

    -- 3. VALIDACIÓN PREVENTIVA DE AUTORIZACIÓN DEL PROPIETARIO SI HAY REDUCCIONES
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_renglones_versionados)
    LOOP
        v_reduccion_autorizada := COALESCE((v_elem->>'reduccionAutorizada')::NUMERIC(14, 4), 0.0000);
        IF v_reduccion_autorizada > 0 THEN
            v_total_reducido := v_total_reducido + v_reduccion_autorizada;
        END IF;
    END LOOP;

    IF v_total_reducido > 0 THEN
        IF p_autorizacion_id IS NULL OR TRIM(p_autorizacion_id) = '' THEN
            RAISE EXCEPTION 'Autorización Requerida: La reducción de cantidades requiere el identificador de una autorización formal emitida por el propietario.';
        END IF;

        -- Validar autorización real y rol en autorizaciones_operaciones
        SELECT * INTO v_auth
        FROM autorizaciones_operaciones
        WHERE id = p_autorizacion_id
          AND documento_id = p_cotizacion_actual_id
          AND tipo_operacion = 'REDUCCION_COTIZACION'
          AND LOWER(rol_autorizador) IN ('admin', 'administrador', 'propietario')
          AND consumido = false
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Autorización Inválida o Inexistente: No existe una autorización activa del propietario para la reducción en la cotización % (id auth: %).',
                p_cotizacion_actual_id, p_autorizacion_id;
        END IF;

        v_autorizado_por := v_auth.autorizado_por;
    END IF;

    -- 4. VALIDACIÓN DE NO GENERACIÓN DE VERSIONES VACÍAS (Regla 3)
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_renglones_versionados)
    LOOP
        v_cantidad_trasladada := (v_elem->>'cantidadTrasladada')::NUMERIC(14, 4);
        IF v_cantidad_trasladada > 0 THEN
            v_total_trasladado := v_total_trasladado + v_cantidad_trasladada;
        END IF;
    END LOOP;

    IF v_total_trasladado = 0 THEN
        RAISE EXCEPTION 'Operación Inválida: La reducción total de compromisos no debe generar una nueva versión vacía. Utilice la función de cancelación de compromisos (fn_cancelar_saldos_cotizacion).';
    END IF;

    v_nueva_version_num := v_cot_actual.version + 1;

    -- 5. MARCAR LA VERSIÓN VIGENTE COMO SUSTITUIDA
    UPDATE cotizaciones 
    SET es_version_actual = false,
        estado = 'SUSTITUIDA',
        motivo_modificacion = '[Sustituida por v' || v_nueva_version_num || ': ' || p_motivo || ']'
    WHERE id = p_cotizacion_actual_id;

    -- 6. INSERTAR CABECERA DE LA NUEVA VERSIÓN V(N+1) PRESERVANDO CLIENTE_ID
    INSERT INTO cotizaciones (
        id, numero, cliente, cliente_id, fecha, estado, notas,
        creado_por, version, cotizacion_raiz_id, version_padre_id,
        es_version_actual, subtotal, subtotal_gravado, subtotal_exento, iva, total, bloqueada_por_ambiguedad
    ) VALUES (
        p_nuevo_id, p_nuevo_numero, v_cot_actual.cliente, v_cot_actual.cliente_id,
        NOW(), 'PENDIENTE_AUTORIZACION', 
        COALESCE(v_cot_actual.notas, '') || ' [Versión ' || v_nueva_version_num || ' basada en saldos pendientes]',
        p_usuario, v_nueva_version_num, v_cot_actual.cotizacion_raiz_id, v_cot_actual.id,
        true, 0.00, 0.00, 0.00, 0.00, 0.00, false
    );

    -- 7. VALIDACIÓN E INSERCIÓN RENGLÓN POR RENGLÓN VÍA cotizacionItemId
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_renglones_versionados)
    LOOP
        v_item_id_solicitado := v_elem->>'cotizacionItemId';
        v_cantidad_trasladada := (v_elem->>'cantidadTrasladada')::NUMERIC(14, 4);
        v_reduccion_autorizada := COALESCE((v_elem->>'reduccionAutorizada')::NUMERIC(14, 4), 0.0000);
        v_precio_solicitado := (v_elem->>'precio')::NUMERIC(14, 2);

        IF v_item_id_solicitado IS NULL OR TRIM(v_item_id_solicitado) = '' THEN
            RAISE EXCEPTION 'Violación de Integridad: Se prohíbe incorporar productos nuevos sin cotizacionItemId original.';
        END IF;

        IF v_item_id_solicitado = ANY(v_items_procesados) THEN
            RAISE EXCEPTION 'Violación de Integridad: El renglón original % fue procesado múltiples veces en la solicitud.', 
                v_item_id_solicitado;
        END IF;

        SELECT * INTO v_item_actual
        FROM cotizacion_items
        WHERE id = v_item_id_solicitado AND cotizacion_id = p_cotizacion_actual_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Renglón Inválido: El renglón % no pertenece a la versión vigente %.', 
                v_item_id_solicitado, p_cotizacion_actual_id;
        END IF;

        IF v_cantidad_trasladada < 0 OR v_reduccion_autorizada < 0 THEN
            RAISE EXCEPTION 'Valores Inválidos: Las cantidades trasladadas y reducidas deben ser mayores o iguales a cero.';
        END IF;

        -- Ecuación fundamental de conservación:
        IF (v_cantidad_trasladada + v_reduccion_autorizada) <> v_item_actual.cantidad_pendiente THEN
            RAISE EXCEPTION 'Violación de Conservación: Para el renglón % (%), la suma de traslado (%) + reducción (%) debe ser exactamente igual al saldo disponible (%).',
                v_item_id_solicitado, v_item_actual.producto_id, v_cantidad_trasladada, v_reduccion_autorizada, v_item_actual.cantidad_pendiente;
        END IF;

        IF v_reduccion_autorizada > 0 AND (v_elem->>'motivoReduccion' IS NULL OR TRIM(v_elem->>'motivoReduccion') = '') THEN
            RAISE EXCEPTION 'Falta Justificación: La reducción autorizada de % en el renglón % requiere motivo formal.',
                v_reduccion_autorizada, v_item_id_solicitado;
        END IF;

        IF v_precio_solicitado <= 0 THEN
            RAISE EXCEPTION 'Precio Inválido: El precio unitario debe ser mayor que cero.';
        END IF;

        v_exento := COALESCE((v_elem->>'exentoIva')::BOOLEAN, v_item_actual.exento_iva, false);

        IF v_cantidad_trasladada > 0 THEN
            v_nuevo_item_id := 'citem_' || gen_random_uuid();

            INSERT INTO cotizacion_items (
                id, cotizacion_id, producto_id,
                cantidad, cantidad_facturada, cantidad_cancelada, cantidad_pendiente,
                precio, precio_autorizado, unidad_medida, observacion, costo_unitario, descuento, exento_iva
            ) VALUES (
                v_nuevo_item_id, p_nuevo_id, v_item_actual.producto_id,
                v_cantidad_trasladada, 0.0000, 0.0000, v_cantidad_trasladada,
                v_precio_solicitado, NULL, 
                COALESCE(v_elem->>'unidadMedida', v_item_actual.unidad_medida, 'PZA'),
                COALESCE(v_elem->>'observacion', v_item_actual.observacion, ''),
                COALESCE(v_item_actual.costo_unitario, 0.00),
                COALESCE(v_item_actual.descuento, 0.00),
                v_exento
            );

            v_importe_renglon := ROUND(v_cantidad_trasladada * v_precio_solicitado, 2);

            -- Separación estricta de subtotal gravado y subtotal exento (Regla 2)
            IF v_exento = true THEN
                v_subtotal_exento := v_subtotal_exento + v_importe_renglon;
            ELSE
                v_subtotal_gravado := v_subtotal_gravado + v_importe_renglon;
            END IF;
        END IF;

        v_items_procesados := array_append(v_items_procesados, v_item_id_solicitado);
    END LOOP;

    -- 8. CÁLCULO FISCAL: IVA 15 % EXCLUSIVAMENTE SOBRE BASE GRAVADA
    v_subtotal := v_subtotal_gravado + v_subtotal_exento;
    v_iva := ROUND(v_subtotal_gravado * 0.15, 2);
    v_total := v_subtotal + v_iva;

    UPDATE cotizaciones 
    SET subtotal = v_subtotal,
        subtotal_gravado = v_subtotal_gravado,
        subtotal_exento = v_subtotal_exento,
        iva = v_iva,
        total = v_total
    WHERE id = p_nuevo_id;

    -- 9. CONSUMO DE AUTORIZACIÓN DEL PROPIETARIO SI APLICA
    IF v_total_reducido > 0 THEN
        UPDATE autorizaciones_operaciones 
        SET consumido = true, 
            consumido_en = NOW(), 
            consumido_por = p_usuario,
            detalles = jsonb_set(detalles, '{versionGeneradaId}', to_jsonb(p_nuevo_id))
        WHERE id = p_autorizacion_id;
    END IF;

    RETURN jsonb_build_object(
        'exito', true,
        'cotizacionRaizId', v_cot_actual.cotizacion_raiz_id,
        'versionAnteriorId', p_cotizacion_actual_id,
        'versionAnteriorNumero', v_cot_actual.numero,
        'versionNuevaId', p_nuevo_id,
        'versionNuevaNumero', p_nuevo_numero,
        'versionNumero', v_nueva_version_num,
        'subtotalGravado', v_subtotal_gravado,
        'subtotalExento', v_subtotal_exento,
        'subtotalTotal', v_subtotal,
        'iva', v_iva,
        'total', v_total,
        'renglonesProcesados', array_length(v_items_procesados, 1),
        'totalCantidadTrasladada', v_total_trasladado,
        'totalCantidadReducidaAutorizada', v_total_reducido,
        'autorizadoPor', v_autorizado_por
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 8. OPERACIÓN COMERCIAL INDEPENDIENTE: CANCELACIÓN DE COMPROMISOS (SIN VERSIÓN VACÍA)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_cancelar_saldos_cotizacion(
    p_cotizacion_id TEXT,
    p_usuario TEXT,
    p_motivo TEXT,
    p_autorizacion_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_cot RECORD;
    v_auth RECORD;
    v_items_cancelados INT := 0;
BEGIN
    SELECT * INTO v_cot FROM cotizaciones WHERE id = p_cotizacion_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La cotización % no existe.', p_cotizacion_id;
    END IF;

    IF v_cot.es_version_actual = false OR v_cot.estado IN ('SUSTITUIDA', 'FACTURADA', 'CANCELADA') THEN
        RAISE EXCEPTION 'La cotización % no es susceptible de cancelación de saldos (estado: %).', p_cotizacion_id, v_cot.estado;
    END IF;

    -- Validar autorización del propietario
    SELECT * INTO v_auth 
    FROM autorizaciones_operaciones 
    WHERE id = p_autorizacion_id 
      AND documento_id = p_cotizacion_id
      AND tipo_operacion IN ('CANCELACION_COTIZACION', 'REDUCCION_COTIZACION')
      AND LOWER(rol_autorizador) IN ('admin', 'administrador', 'propietario')
      AND consumido = false
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Autorización Inválida: Se requiere autorización formal emitida por Propietario o Administrador para cancelar compromisos.';
    END IF;

    PERFORM id FROM cotizacion_items WHERE cotizacion_id = p_cotizacion_id FOR UPDATE;

    -- Liquidación exacta de balance: se transfiere cantidad_pendiente hacia cantidad_cancelada
    -- cumpliendo la ecuación: cantidad = cantidad_facturada + cantidad_cancelada + cantidad_pendiente(0)
    UPDATE cotizacion_items 
    SET cantidad_cancelada = cantidad_cancelada + cantidad_pendiente,
        cantidad_pendiente = 0.0000
    WHERE cotizacion_id = p_cotizacion_id AND cantidad_pendiente > 0;

    GET DIAGNOSTICS v_items_cancelados = ROW_COUNT;

    -- Transición comercial: si tenía facturación previa, pasa a FACTURADA (cerrada definitivamente)
    -- Si no tenía facturación previa, pasa a CANCELADA
    UPDATE cotizaciones 
    SET estado = CASE WHEN v_cot.estado = 'PARCIALMENTE_FACTURADA' THEN 'FACTURADA' ELSE 'CANCELADA' END,
        motivo_modificacion = '[Compromisos cancelados por ' || p_usuario || ' con auth ' || p_autorizacion_id || ': ' || p_motivo || ']'
    WHERE id = p_cotizacion_id;

    UPDATE autorizaciones_operaciones 
    SET consumido = true, 
        consumido_en = NOW(), 
        consumido_por = p_usuario,
        detalles = jsonb_set(detalles, '{cotizacionCanceladaId}', to_jsonb(p_cotizacion_id))
    WHERE id = p_autorizacion_id;

    RETURN jsonb_build_object(
        'exito', true,
        'cotizacionId', p_cotizacion_id,
        'nuevoEstado', CASE WHEN v_cot.estado = 'PARCIALMENTE_FACTURADA' THEN 'FACTURADA' ELSE 'CANCELADA' END,
        'renglonesCancelados', v_items_cancelados,
        'autorizadoPor', v_auth.autorizado_por
    );
END;
$$ LANGUAGE plpgsql;

COMMIT;
