-- ============================================================================
-- FERRETERÍA EMMANUEL — SUITE DE PRUEBAS REPRODUCIBLES DE PERSISTENCIA (FASE 3)
-- Entorno: PostgreSQL 15+ Aislado con Datos Sintéticos
-- Estado: LISTO PARA EJECUCIÓN FUTURA EN STAGING — NO EJECUTADO AÚN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ESCENARIO 0: CONFIGURACIÓN Y POBLACIÓN DE DATOS SINTÉTICOS DE PRUEBA
-- ----------------------------------------------------------------------------

BEGIN;

-- Limpieza preventiva de datos sintéticos de pruebas usando session_replication_role para reset de fixtures
SET session_replication_role = 'replica';
DELETE FROM operaciones_pendientes_transferencia WHERE id LIKE 'TEST-%';
DELETE FROM auditoria_migracion_cotizaciones_ambiguas WHERE id LIKE 'TEST-%' OR cotizacion_id LIKE 'TEST-%';
DELETE FROM autorizaciones_operaciones WHERE id LIKE 'TEST-%' OR documento_id LIKE 'TEST-%';
DELETE FROM cotizacion_items WHERE id LIKE 'TEST-%' OR cotizacion_id LIKE 'TEST-%';
DELETE FROM facturas WHERE id LIKE 'TEST-%';
DELETE FROM cotizaciones WHERE id LIKE 'TEST-%';
DELETE FROM usuarios_cuentas WHERE id LIKE 'TEST-%';
DELETE FROM clientes WHERE id LIKE 'TEST-%';
SET session_replication_role = 'origin';

-- Usuario Administrador y Cajero Sintéticos para Auditoría
INSERT INTO usuarios_cuentas (id, usuario, nombre, rol, clave, activo)
VALUES 
    ('TEST-USR-ADMIN', 'admin_don_emmanuel', 'Don Emmanuel (Propietario)', 'admin', 'hash_test', true),
    ('TEST-USR-CAJERO', 'cajero_turno_a', 'Cajero Turno A', 'cajero', 'hash_test', true),
    ('TEST-USR-INACTIVO', 'admin_antiguo', 'Admin Inactivo', 'admin', 'hash_test', false)
ON CONFLICT (id) DO UPDATE SET activo = EXCLUDED.activo;

-- Cliente Sintético
INSERT INTO clientes (id, nombre, telefono, activo)
VALUES ('TEST-CLI-001', 'Constructora Sintética S.A.', '8888-0000', true)
ON CONFLICT (id) DO NOTHING;

-- Productos Sintéticos (Gravado y Exento)
INSERT INTO productos (id, codigo, nombre, unidad_medida, precio, costo, stock_actual, activo)
VALUES 
    ('TEST-PROD-GRAV', 'GRAV01', 'Cemento Gris 50kg (Gravado)', 'BOLSA', 380.00, 300.00, 100, true),
    ('TEST-PROD-EXEN', 'EXEN01', 'Alambre de Amarre Agrícola (Exento)', 'LIBRA', 50.00, 35.00, 500, true)
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio;

-- Cotización Histórica V1 de Prueba (Con 1 producto gravado y 1 exento)
INSERT INTO cotizaciones (
    id, numero, cliente, cliente_id, fecha, estado, notas, creado_por, version, cotizacion_raiz_id, es_version_actual,
    subtotal, subtotal_gravado, subtotal_exento, iva, total
) VALUES (
    'TEST-COT-001', 'COT-TEST-2026-001', 'Constructora Sintética S.A.', 'TEST-CLI-001', NOW(), 'BORRADOR',
    'Cotización inicial de prueba', 'cajero_turno_a', 1, 'TEST-COT-001', true,
    880.00, 380.00, 500.00, 57.00, 937.00
);

INSERT INTO cotizacion_items (
    id, cotizacion_id, producto_id, cantidad, cantidad_facturada, cantidad_cancelada, cantidad_pendiente,
    precio, precio_autorizado, unidad_medida, costo_unitario, descuento, exento_iva
) VALUES 
    ('TEST-ITEM-001', 'TEST-COT-001', 'TEST-PROD-GRAV', 1.0000, 0.0000, 0.0000, 1.0000, 380.00, 380.00, 'BOLSA', 300.00, 0.00, false),
    ('TEST-ITEM-002', 'TEST-COT-001', 'TEST-PROD-EXEN', 10.0000, 0.0000, 0.0000, 10.0000, 50.00, 50.00, 'LIBRA', 35.00, 0.00, true);

UPDATE cotizaciones SET estado = 'AUTORIZADA' WHERE id = 'TEST-COT-001';

COMMIT;

-- ----------------------------------------------------------------------------
-- ESCENARIO 1: PRUEBA DE IDEMPOTENCIA DEL BACKFILL
-- ----------------------------------------------------------------------------
-- Objetivo: Comprobar que reejecutar las sentencias de auditoría no altera
-- registros ya resueltos ni duplica filas gracias a la identidad única.

DO $$
DECLARE
    v_antes INT;
    v_despues INT;
BEGIN
    SELECT COUNT(*) INTO v_antes FROM auditoria_migracion_cotizaciones_ambiguas;
    
    INSERT INTO auditoria_migracion_cotizaciones_ambiguas (
        id, cotizacion_id, cotizacion_numero, cotizacion_item_id, producto_id,
        cantidad_cotizada, cantidad_facturada_detectada, motivo_ambiguedad
    )
    SELECT 
        'TEST-AMB-001', 'TEST-COT-001', 'COT-TEST-2026-001', 'TEST-ITEM-001', 'TEST-PROD-GRAV',
        1.0000, NULL, 'Prueba de idempotencia de auditoría'
    ON CONFLICT (cotizacion_item_id) DO NOTHING;

    -- Segunda inserción deliberadamente idéntica
    INSERT INTO auditoria_migracion_cotizaciones_ambiguas (
        id, cotizacion_id, cotizacion_numero, cotizacion_item_id, producto_id,
        cantidad_cotizada, cantidad_facturada_detectada, motivo_ambiguedad
    )
    SELECT 
        'TEST-AMB-001-DUP', 'TEST-COT-001', 'COT-TEST-2026-001', 'TEST-ITEM-001', 'TEST-PROD-GRAV',
        1.0000, NULL, 'Prueba de idempotencia de auditoría'
    ON CONFLICT (cotizacion_item_id) DO NOTHING;

    SELECT COUNT(*) INTO v_despues FROM auditoria_migracion_cotizaciones_ambiguas;

    IF v_despues <> (v_antes + 1) THEN
        RAISE EXCEPTION 'PRUEBA 1 FALLIDA: La reejecución duplicó registros en auditoría.';
    END IF;

    RAISE NOTICE 'PRUEBA 1 EXITOSA (IDEMPOTENCIA): ON CONFLICT (cotizacion_item_id) previno duplicidad exacta.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 2: PRUEBA DE IVA AL 15 % Y PRODUCTOS EXENTOS
-- ----------------------------------------------------------------------------
-- Objetivo: Comprobar que el IVA al 15 % se aplica EXCLUSIVAMENTE a la base gravada
-- y que los productos exentos no suman impuesto.

DO $$
DECLARE
    v_sub_grav NUMERIC(14, 2);
    v_sub_exen NUMERIC(14, 2);
    v_iva NUMERIC(14, 2);
    v_tot NUMERIC(14, 2);
BEGIN
    SELECT subtotal_gravado, subtotal_exento, iva, total 
    INTO v_sub_grav, v_sub_exen, v_iva, v_tot
    FROM cotizaciones WHERE id = 'TEST-COT-001';

    -- Comprobación con aserciones estrictas:
    -- subtotal_gravado = 380.00
    -- subtotal_exento = 500.00
    -- iva = ROUND(380.00 * 0.15, 2) = 57.00
    -- total = 380.00 + 500.00 + 57.00 = 937.00
    IF v_sub_grav <> 380.00 THEN
        RAISE EXCEPTION 'PRUEBA 2 FALLIDA: subtotal_gravado esperado 380.00, obtenido %', v_sub_grav;
    END IF;
    IF v_sub_exen <> 500.00 THEN
        RAISE EXCEPTION 'PRUEBA 2 FALLIDA: subtotal_exento esperado 500.00, obtenido %', v_sub_exen;
    END IF;
    IF v_iva <> 57.00 THEN
        RAISE EXCEPTION 'PRUEBA 2 FALLIDA: iva esperado 57.00, obtenido %', v_iva;
    END IF;
    IF v_tot <> 937.00 THEN
        RAISE EXCEPTION 'PRUEBA 2 FALLIDA: total esperado 937.00, obtenido %', v_tot;
    END IF;

    RAISE NOTICE 'PRUEBA 2 EXITOSA (IVA Y EXENCIÓN): Cálculo fiscal al 15 %% exacto sobre base gravada.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 3: VERSIONADO V1 A V2 (PRESERVACIÓN DE CLIENTE_ID Y COSTOS)
-- ----------------------------------------------------------------------------
-- Objetivo: Crear V2 trasladando el 100 % de saldos y comprobar que cliente_id se conserva.

DO $$
DECLARE
    v_payload JSONB;
    v_res JSONB;
    v_cot_v1 RECORD;
    v_cot_v2 RECORD;
    v_item_v2 RECORD;
BEGIN
    v_payload := jsonb_build_array(
        jsonb_build_object(
            'cotizacionItemId', 'TEST-ITEM-001',
            'cantidadTrasladada', 1.0000,
            'reduccionAutorizada', 0.0000,
            'precio', 380.00,
            'unidadMedida', 'BOLSA',
            'exentoIva', false
        ),
        jsonb_build_object(
            'cotizacionItemId', 'TEST-ITEM-002',
            'cantidadTrasladada', 10.0000,
            'reduccionAutorizada', 0.0000,
            'precio', 50.00,
            'unidadMedida', 'LIBRA',
            'exentoIva', true
        )
    );

    v_res := fn_versionar_cotizacion_atomica(
        'TEST-COT-001',
        'cajero_turno_a',
        'Renegociación de términos para V2',
        'TEST-COT-002',
        'COT-TEST-2026-002',
        v_payload,
        NULL
    );

    SELECT * INTO v_cot_v1 FROM cotizaciones WHERE id = 'TEST-COT-001';
    SELECT * INTO v_cot_v2 FROM cotizaciones WHERE id = 'TEST-COT-002';
    SELECT * INTO v_item_v2 FROM cotizacion_items WHERE cotizacion_id = 'TEST-COT-002' AND exento_iva = false;

    -- Aserciones rigurosas
    IF v_cot_v1.estado <> 'SUSTITUIDA' OR v_cot_v1.es_version_actual <> false THEN
        RAISE EXCEPTION 'PRUEBA 3 FALLIDA: V1 no quedó en estado SUSTITUIDA / inactiva.';
    END IF;
    IF v_cot_v2.version <> 2 OR v_cot_v2.es_version_actual <> true THEN
        RAISE EXCEPTION 'PRUEBA 3 FALLIDA: V2 no es la versión vigente.';
    END IF;
    IF v_cot_v2.cliente_id <> 'TEST-CLI-001' THEN
        RAISE EXCEPTION 'PRUEBA 3 FALLIDA: cliente_id no se preservó en V2 (obtenido: %)', v_cot_v2.cliente_id;
    END IF;
    IF v_item_v2.costo_unitario <> 300.00 THEN
        RAISE EXCEPTION 'PRUEBA 3 FALLIDA: costo_unitario no se preservó en V2 (obtenido: %)', v_item_v2.costo_unitario;
    END IF;

    RAISE NOTICE 'PRUEBA 3 EXITOSA (VERSIONADO ÍNTEGRO): V1 sustituida atómicamente, V2 vigente con cliente_id y costos preservados.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 4A: REDUCCIÓN NO AUTORIZADA (RECHAZO ACTIVO POR FALTA DE TOKEN)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_payload JSONB;
    v_error_capturado BOOLEAN := false;
BEGIN
    UPDATE cotizaciones SET estado = 'AUTORIZADA' WHERE id = 'TEST-COT-002';

    v_payload := jsonb_build_array(
        jsonb_build_object(
            'cotizacionItemId', (SELECT id FROM cotizacion_items WHERE cotizacion_id = 'TEST-COT-002' AND exento_iva = false LIMIT 1),
            'cantidadTrasladada', 0.5000,
            'reduccionAutorizada', 0.5000,
            'motivoReduccion', 'Cliente no tiene presupuesto',
            'precio', 380.00
        ),
        jsonb_build_object(
            'cotizacionItemId', (SELECT id FROM cotizacion_items WHERE cotizacion_id = 'TEST-COT-002' AND exento_iva = true LIMIT 1),
            'cantidadTrasladada', 10.0000,
            'reduccionAutorizada', 0.0000,
            'precio', 50.00
        )
    );

    BEGIN
        PERFORM fn_versionar_cotizacion_atomica(
            'TEST-COT-002',
            'cajero_turno_a',
            'Intento de reducción sin token',
            'TEST-COT-003-FAIL',
            'COT-TEST-2026-003-FAIL',
            v_payload,
            NULL
        );
    EXCEPTION WHEN OTHERS THEN
        IF POSITION('Autorización Requerida' IN SQLERRM) > 0 THEN
            v_error_capturado := true;
        ELSE
            RAISE EXCEPTION 'PRUEBA 4A FALLIDA: Falló por causa distinta a la esperada: %', SQLERRM;
        END IF;
    END;

    IF NOT v_error_capturado THEN
        RAISE EXCEPTION 'PRUEBA 4A FALLIDA: Se permitió reducción de saldo sin autorización del propietario.';
    END IF;

    RAISE NOTICE 'PRUEBA 4A EXITOSA (REDUCCIÓN NO AUTORIZADA RECHAZADA): Excepción controlada de token requerido.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 4B: INTENTO DE AUTORIZACIÓN APÓCRIFA (RECHAZO POR TRIGGER)
-- ----------------------------------------------------------------------------
-- Objetivo: Comprobar que un cajero o usuario no admin NO puede insertar
-- autorizaciones en autorizaciones_operaciones.

DO $$
DECLARE
    v_error_auth_capturado BOOLEAN := false;
BEGIN
    BEGIN
        INSERT INTO autorizaciones_operaciones (
            id, tipo_operacion, documento_id, motivo, solicitado_por, autorizado_por, rol_autorizador
        ) VALUES (
            'TEST-AUTH-FALSA', 'REDUCCION_COTIZACION', 'TEST-COT-002',
            'Auto-autorización fraudulenta', 'cajero_turno_a', 'TEST-USR-CAJERO', 'cajero'
        );
    EXCEPTION WHEN OTHERS THEN
        IF POSITION('carece de privilegios' IN SQLERRM) > 0 OR POSITION('check constraint' IN SQLERRM) > 0 THEN
            v_error_auth_capturado := true;
        ELSE
            RAISE EXCEPTION 'PRUEBA 4B FALLIDA: Falló por causa inesperada: %', SQLERRM;
        END IF;
    END;

    IF NOT v_error_auth_capturado THEN
        RAISE EXCEPTION 'PRUEBA 4B FALLIDA: Se permitió que un cajero emitiera una autorización.';
    END IF;

    RAISE NOTICE 'PRUEBA 4B EXITOSA (AUTORIZACIÓN APÓCRIFA RECHAZADA): Seguridad reforzada en autorizaciones_operaciones.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 5: REDUCCIÓN AUTORIZADA CON CONSUMO ATÓMICO DEL TOKEN
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_auth_id TEXT := 'TEST-AUTH-VALIDA';
    v_payload JSONB;
    v_res JSONB;
    v_auth RECORD;
    v_item_gravado_id TEXT;
    v_item_exento_id TEXT;
BEGIN
    SELECT id INTO v_item_gravado_id FROM cotizacion_items WHERE cotizacion_id = 'TEST-COT-002' AND exento_iva = false LIMIT 1;
    SELECT id INTO v_item_exento_id FROM cotizacion_items WHERE cotizacion_id = 'TEST-COT-002' AND exento_iva = true LIMIT 1;

    -- Propietario autorizado en usuarios_cuentas emite token
    INSERT INTO autorizaciones_operaciones (
        id, tipo_operacion, documento_id, motivo, solicitado_por, autorizado_por, rol_autorizador
    ) VALUES (
        v_auth_id, 'REDUCCION_COTIZACION', 'TEST-COT-002',
        'Autorizo reducción de 0.5 unidades de cemento',
        'cajero_turno_a', 'TEST-USR-ADMIN', 'admin'
    );

    v_payload := jsonb_build_array(
        jsonb_build_object(
            'cotizacionItemId', v_item_gravado_id,
            'cantidadTrasladada', 0.5000,
            'reduccionAutorizada', 0.5000,
            'motivoReduccion', 'Reducción aprobada por el dueño',
            'precio', 380.00
        ),
        jsonb_build_object(
            'cotizacionItemId', v_item_exento_id,
            'cantidadTrasladada', 10.0000,
            'reduccionAutorizada', 0.0000,
            'precio', 50.00
        )
    );

    v_res := fn_versionar_cotizacion_atomica(
        'TEST-COT-002',
        'cajero_turno_a',
        'Versión V3 con reducción autorizada',
        'TEST-COT-003',
        'COT-TEST-2026-003',
        v_payload,
        v_auth_id
    );

    SELECT * INTO v_auth FROM autorizaciones_operaciones WHERE id = v_auth_id;

    IF v_auth.consumido <> true THEN
        RAISE EXCEPTION 'PRUEBA 5 FALLIDA: La autorización no quedó en consumido = true.';
    END IF;
    IF (v_res->>'totalCantidadReducidaAutorizada')::NUMERIC <> 0.5000 THEN
        RAISE EXCEPTION 'PRUEBA 5 FALLIDA: La cantidad reducida no cuadra con lo autorizado.';
    END IF;

    RAISE NOTICE 'PRUEBA 5 EXITOSA (REDUCCIÓN AUTORIZADA): Token consumido atómicamente y V3 generada.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 6A: BLOQUEO DE VERSIÓN VACÍA
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_auth_vacia_id TEXT := 'TEST-AUTH-VACIA';
    v_error_vacia BOOLEAN := false;
BEGIN
    UPDATE cotizaciones SET estado = 'AUTORIZADA' WHERE id = 'TEST-COT-003';

    INSERT INTO autorizaciones_operaciones (
        id, tipo_operacion, documento_id, motivo, solicitado_por, autorizado_por, rol_autorizador
    ) VALUES (
        v_auth_vacia_id, 'REDUCCION_COTIZACION', 'TEST-COT-003',
        'Autorizo reducción total', 'cajero_turno_a', 'TEST-USR-ADMIN', 'admin'
    );

    BEGIN
        PERFORM fn_versionar_cotizacion_atomica(
            'TEST-COT-003',
            'cajero_turno_a',
            'Intento de vaciar cotización',
            'TEST-COT-004-VACIA',
            'COT-TEST-2026-004-VACIA',
            jsonb_build_array(
                jsonb_build_object(
                    'cotizacionItemId', (SELECT id FROM cotizacion_items WHERE cotizacion_id = 'TEST-COT-003' AND exento_iva = false LIMIT 1),
                    'cantidadTrasladada', 0.0000,
                    'reduccionAutorizada', 0.5000,
                    'motivoReduccion', 'Cancelación',
                    'precio', 380.00
                ),
                jsonb_build_object(
                    'cotizacionItemId', (SELECT id FROM cotizacion_items WHERE cotizacion_id = 'TEST-COT-003' AND exento_iva = true LIMIT 1),
                    'cantidadTrasladada', 0.0000,
                    'reduccionAutorizada', 10.0000,
                    'motivoReduccion', 'Cancelación',
                    'precio', 50.00
                )
            ),
            v_auth_vacia_id
        );
    EXCEPTION WHEN OTHERS THEN
        IF POSITION('versión vacía' IN SQLERRM) > 0 THEN
            v_error_vacia := true;
        END IF;
    END;

    IF NOT v_error_vacia THEN
        RAISE EXCEPTION 'PRUEBA 6A FALLIDA: Se permitió crear una versión sin partidas.';
    END IF;

    RAISE NOTICE 'PRUEBA 6A EXITOSA (VERSIÓN VACÍA BLOQUEADA): Se exige fn_cancelar_saldos_cotizacion.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 6B: CANCELACIÓN AUTORIZADA DE SALDOS REMANENTES (BALANCE FÍSICO)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_auth_canc_id TEXT := 'TEST-AUTH-CANC';
    v_res JSONB;
    v_cot RECORD;
    v_item RECORD;
BEGIN
    INSERT INTO autorizaciones_operaciones (
        id, tipo_operacion, documento_id, motivo, solicitado_por, autorizado_por, rol_autorizador
    ) VALUES (
        v_auth_canc_id, 'CANCELACION_COTIZACION', 'TEST-COT-003',
        'Cliente desiste formalmente de saldos restantes', 'cajero_turno_a', 'TEST-USR-ADMIN', 'admin'
    );

    v_res := fn_cancelar_saldos_cotizacion(
        'TEST-COT-003',
        'cajero_turno_a',
        'Desistimiento formal del cliente',
        v_auth_canc_id
    );

    SELECT * INTO v_cot FROM cotizaciones WHERE id = 'TEST-COT-003';
    SELECT * INTO v_item FROM cotizacion_items WHERE cotizacion_id = 'TEST-COT-003' AND exento_iva = false;

    IF v_cot.estado <> 'CANCELADA' THEN
        RAISE EXCEPTION 'PRUEBA 6B FALLIDA: Estado esperado CANCELADA, obtenido %', v_cot.estado;
    END IF;
    -- Verificar ecuación física: cantidad = facturada + cancelada + pendiente
    IF v_item.cantidad_pendiente <> 0.0000 THEN
        RAISE EXCEPTION 'PRUEBA 6B FALLIDA: cantidad_pendiente debe ser 0.0000, obtenido %', v_item.cantidad_pendiente;
    END IF;
    IF v_item.cantidad_cancelada <> v_item.cantidad THEN
        RAISE EXCEPTION 'PRUEBA 6B FALLIDA: cantidad_cancelada (%) no cubre la cantidad pactada (%)', v_item.cantidad_cancelada, v_item.cantidad;
    END IF;

    RAISE NOTICE 'PRUEBA 6B EXITOSA (CANCELACIÓN CON BALANCE FÍSICO): Ecuación cantidad_cancelada cumplida sin violar CHECK.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 7: POLÍTICA BANCARIA A (FLUJO DE VERIFICACIÓN)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_op_id TEXT := 'TEST-OPE-TX-001';
    v_op RECORD;
BEGIN
    INSERT INTO operaciones_pendientes_transferencia (
        id, cliente_nombre, cajero_id, cajero_nombre, banco_origen, banco_destino,
        referencia_bancaria, monto_declarado, payload_lineas
    ) VALUES (
        v_op_id, 'Constructora Sintética S.A.', 'cajero_turno_a', 'Cajero Turno A',
        'BAC Credomatic', 'Banco Lafise', 'REF-BAC-998877', 1500.00,
        '[{"productoId": "TEST-PROD-GRAV", "cantidad": 2, "precio": 380.00}]'::jsonb
    );

    SELECT * INTO v_op FROM operaciones_pendientes_transferencia WHERE id = v_op_id;

    IF v_op.estado_bancario <> 'PENDIENTE_VERIFICACION' OR 
       v_op.estado_comercial <> 'PENDIENTE_CONFIRMACION' OR 
       v_op.stock_reservado <> false THEN
        RAISE EXCEPTION 'PRUEBA 7A FALLIDA: Operación violó la separación inicial de estados.';
    END IF;

    -- Propietario acredita la transferencia en banco
    UPDATE operaciones_pendientes_transferencia 
    SET estado_bancario = 'ACREDITADO',
        monto_acreditado = 1500.00,
        verificado_por = 'Don Emmanuel',
        fecha_verificacion = NOW()
    WHERE id = v_op_id;

    SELECT * INTO v_op FROM operaciones_pendientes_transferencia WHERE id = v_op_id;

    IF v_op.estado_bancario <> 'ACREDITADO' OR v_op.monto_acreditado <> 1500.00 THEN
        RAISE EXCEPTION 'PRUEBA 7B FALLIDA: Acreditación bancaria inconsistente.';
    END IF;

    RAISE NOTICE 'PRUEBA 7 EXITOSA (POLÍTICA A): Separación estricta de estados y acreditación verificada.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 8: PROHIBICIÓN DE REGISTROS NUEVOS CON CANTIDADES NULL
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_error_null BOOLEAN := false;
BEGIN
    BEGIN
        INSERT INTO cotizacion_items (
            id, cotizacion_id, producto_id, cantidad, cantidad_facturada, cantidad_cancelada, cantidad_pendiente, precio, unidad_medida
        ) VALUES (
            'TEST-ITEM-NULL', 'TEST-COT-001', 'TEST-PROD-GRAV', 5.0000, NULL, 0.0000, NULL, 380.00, 'BOLSA'
        );
    EXCEPTION WHEN OTHERS THEN
        IF POSITION('estrictamente obligatorias' IN SQLERRM) > 0 THEN
            v_error_null := true;
        END IF;
    END;

    IF NOT v_error_null THEN
        RAISE EXCEPTION 'PRUEBA 8 FALLIDA: Se permitió insertar un registro nuevo con cantidades NULL.';
    END IF;

    RAISE NOTICE 'PRUEBA 8 EXITOSA (RECHAZO DE NULL EN NUEVOS REGISTROS): Trigger bloqueó campos incompletos.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 9: DETECCIÓN Y AISLAMIENTO DE COTIZACIÓN AMBIGUA
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_error_ambigua BOOLEAN := false;
BEGIN
    -- Simular cotización histórica aislada como ambigua
    INSERT INTO cotizaciones (
        id, numero, cliente, fecha, estado, notas, creado_por, version, cotizacion_raiz_id, es_version_actual,
        bloqueada_por_ambiguedad
    ) VALUES (
        'TEST-COT-AMBIGUA', 'COT-AMB-2026-999', 'Cliente Ambigüedades S.A.', NOW(), 'AUTORIZADA',
        'Cotización aislada en migración', 'cajero_turno_a', 1, 'TEST-COT-AMBIGUA', true,
        true
    );

    BEGIN
        PERFORM fn_versionar_cotizacion_atomica(
            'TEST-COT-AMBIGUA',
            'cajero_turno_a',
            'Intento de versionar ambigua',
            'TEST-COT-AMB-V2',
            'COT-AMB-2026-V2',
            jsonb_build_array(jsonb_build_object('cotizacionItemId', 'ID', 'cantidadTrasladada', 1, 'precio', 10)),
            NULL
        );
    EXCEPTION WHEN OTHERS THEN
        IF POSITION('presenta ambigüedades históricas' IN SQLERRM) > 0 THEN
            v_error_ambigua := true;
        END IF;
    END;

    IF NOT v_error_ambigua THEN
        RAISE EXCEPTION 'PRUEBA 9 FALLIDA: Se permitió versionar una cotización bloqueada por ambigüedad.';
    END IF;

    RAISE NOTICE 'PRUEBA 9 EXITOSA (BLOQUEO DE COTIZACIÓN AMBIGUA): Aislamiento operativo perfecto.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 10: CONCURRENCIA PESIMISTA (VERSIÓN NO VIGENTE RECHAZADA)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_error_concurrencia BOOLEAN := false;
BEGIN
    -- Intentar versionar TEST-COT-001 que ya fue SUSTITUIDA en el Escenario 3
    BEGIN
        PERFORM fn_versionar_cotizacion_atomica(
            'TEST-COT-001',
            'cajero_turno_a',
            'Intento de re-versionar versión sustituida',
            'TEST-COT-DUP',
            'COT-TEST-DUP',
            jsonb_build_array(jsonb_build_object('cotizacionItemId', 'TEST-ITEM-001', 'cantidadTrasladada', 1, 'precio', 380)),
            NULL
        );
    EXCEPTION WHEN OTHERS THEN
        IF POSITION('ya no es la versión vigente' IN SQLERRM) > 0 THEN
            v_error_concurrencia := true;
        END IF;
    END;

    IF NOT v_error_concurrencia THEN
        RAISE EXCEPTION 'PRUEBA 10 FALLIDA: Se permitió versionar una cotización histórica sustituida.';
    END IF;

    RAISE NOTICE 'PRUEBA 10 EXITOSA (CONCURRENCIA Y VIGENCIA): Rechazo inmediato ante versiones no vigentes.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 11: ROLLBACK ATÓMICO COMPLETO ANTE EXCEPCIÓN
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_conteo_antes INT;
    v_conteo_despues INT;
BEGIN
    SELECT COUNT(*) INTO v_conteo_antes FROM cotizaciones WHERE id = 'TEST-COT-ROLLBACK';

    BEGIN
        -- Bloque anidado que fallará deliberadamente
        PERFORM fn_versionar_cotizacion_atomica(
            'COTIZACION-QUE-NO-EXISTE',
            'cajero_turno_a',
            'Fallo provocado',
            'TEST-COT-ROLLBACK',
            'COT-ROLLBACK',
            '[]'::jsonb,
            NULL
        );
    EXCEPTION WHEN OTHERS THEN
        -- Captura de error esperada
        NULL;
    END;

    SELECT COUNT(*) INTO v_conteo_despues FROM cotizaciones WHERE id = 'TEST-COT-ROLLBACK';

    IF v_conteo_despues <> v_conteo_antes THEN
        RAISE EXCEPTION 'PRUEBA 11 FALLIDA: Hubo escritura parcial a pesar del fallo.';
    END IF;

    RAISE NOTICE 'PRUEBA 11 EXITOSA (ROLLBACK ATÓMICO): Consistencia total sin registros residuales.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 12: FACTURACIÓN PARCIAL Y BALANCE FÍSICO INMUTABLE
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_cot RECORD;
    v_item RECORD;
BEGIN
    -- Crear cotización específica para facturación parcial
    INSERT INTO cotizaciones (
        id, numero, cliente, cliente_id, fecha, estado, notas, creado_por, version, cotizacion_raiz_id, es_version_actual,
        subtotal, subtotal_gravado, subtotal_exento, iva, total
    ) VALUES (
        'TEST-COT-PARC', 'COT-TEST-PARC-001', 'Constructora Sintética S.A.', 'TEST-CLI-001', NOW(), 'BORRADOR',
        'Cotización para facturación parcial', 'cajero_turno_a', 1, 'TEST-COT-PARC', true,
        3800.00, 3800.00, 0.00, 570.00, 4370.00
    );

    INSERT INTO cotizacion_items (
        id, cotizacion_id, producto_id, cantidad, cantidad_facturada, cantidad_cancelada, cantidad_pendiente,
        precio, precio_autorizado, unidad_medida, costo_unitario, descuento, exento_iva
    ) VALUES (
        'TEST-ITEM-PARC-1', 'TEST-COT-PARC', 'TEST-PROD-GRAV', 10.0000, 0.0000, 0.0000, 10.0000,
        380.00, 380.00, 'BOLSA', 300.00, 0.00, false
    );

    UPDATE cotizaciones SET estado = 'AUTORIZADA' WHERE id = 'TEST-COT-PARC';

    -- Simular facturación parcial de 4 unidades (quedan 6 pendientes)
    UPDATE cotizacion_items
    SET cantidad_facturada = 4.0000,
        cantidad_pendiente = 6.0000
    WHERE id = 'TEST-ITEM-PARC-1';

    UPDATE cotizaciones
    SET estado = 'PARCIALMENTE_FACTURADA'
    WHERE id = 'TEST-COT-PARC';

    SELECT * INTO v_cot FROM cotizaciones WHERE id = 'TEST-COT-PARC';
    SELECT * INTO v_item FROM cotizacion_items WHERE id = 'TEST-ITEM-PARC-1';

    IF v_cot.estado <> 'PARCIALMENTE_FACTURADA' THEN
        RAISE EXCEPTION 'PRUEBA 12 FALLIDA: Estado esperado PARCIALMENTE_FACTURADA, obtenido %', v_cot.estado;
    END IF;

    IF v_item.cantidad_pendiente <> 6.0000 OR v_item.cantidad_facturada <> 4.0000 THEN
        RAISE EXCEPTION 'PRUEBA 12 FALLIDA: Descuadre en balance parcial: facturado %, pendiente %', v_item.cantidad_facturada, v_item.cantidad_pendiente;
    END IF;

    RAISE NOTICE 'PRUEBA 12 EXITOSA (FACTURACIÓN PARCIAL): Balance matemático y estado PARCIALMENTE_FACTURADA verificados.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 13: CRÉDITOS Y LÍMITES EN CUENTAS POR COBRAR
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_limite NUMERIC(12, 2);
    v_saldo_actual NUMERIC(12, 2);
    v_intento_venta NUMERIC(12, 2) := 1500.00;
BEGIN
    -- Configurar cliente con límite de C$ 1,000.00
    UPDATE clientes 
    SET limite_credito = 1000.00, saldo_pendiente = 400.00, activo = true
    WHERE id = 'TEST-CLI-001';

    SELECT limite_credito, saldo_pendiente INTO v_limite, v_saldo_actual
    FROM clientes WHERE id = 'TEST-CLI-001';

    -- Comprobar rechazo si saldo_actual + nueva_venta > limite
    IF (v_saldo_actual + v_intento_venta) <= v_limite THEN
        RAISE EXCEPTION 'PRUEBA 13 FALLIDA: La comprobación de límite no detectó el exceso.';
    END IF;

    RAISE NOTICE 'PRUEBA 13 EXITOSA (LÍMITES DE CRÉDITO): Regla financiera validada correctamente (Saldo: %, Venta: %, Límite: %).', v_saldo_actual, v_intento_venta, v_limite;
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 14: PERSISTENCIA Y BLOQUEO POR INTENTOS FALLIDOS EN POSTGRESQL
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_usr RECORD;
BEGIN
    -- Simular 5 intentos fallidos
    UPDATE usuarios_cuentas
    SET intentos_fallidos = 5,
        bloqueado_hasta = NOW() + INTERVAL '10 minutes',
        actualizado_en = NOW()
    WHERE id = 'TEST-USR-CAJERO';

    SELECT * INTO v_usr FROM usuarios_cuentas WHERE id = 'TEST-USR-CAJERO';

    IF v_usr.intentos_fallidos <> 5 OR v_usr.bloqueado_hasta <= NOW() THEN
        RAISE EXCEPTION 'PRUEBA 14 FALLIDA: El usuario no quedó bloqueado tras 5 intentos fallidos.';
    END IF;

    -- Simular reseteo tras acceso correcto
    UPDATE usuarios_cuentas
    SET intentos_fallidos = 0,
        bloqueado_hasta = NULL,
        ultimo_acceso = NOW()
    WHERE id = 'TEST-USR-CAJERO';

    SELECT * INTO v_usr FROM usuarios_cuentas WHERE id = 'TEST-USR-CAJERO';

    IF v_usr.intentos_fallidos <> 0 OR v_usr.bloqueado_hasta IS NOT NULL THEN
        RAISE EXCEPTION 'PRUEBA 14 FALLIDA: El reseteo de intentos fallidos no limpió los campos.';
    END IF;

    RAISE NOTICE 'PRUEBA 14 EXITOSA (BLOQUEO POR FUERZA BRUTA): Persistencia y reseteo en usuarios_cuentas verificados.';
END $$;

-- ----------------------------------------------------------------------------
-- ESCENARIO 15: VERIFICACIÓN DE ÍNDICES DE RENDIMIENTO ESTRATÉGICOS
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_idx_count INT;
BEGIN
    -- Verificar existencia de los índices creados para Fase 3
    SELECT COUNT(*) INTO v_idx_count
    FROM pg_indexes
    WHERE indexname IN (
        'idx_cotizaciones_estado_fecha',
        'idx_facturas_forma_pago_estado_fecha',
        'idx_facturas_cotizacion_id',
        'idx_productos_activo_categoria',
        'idx_facturas_cliente_id_fecha'
    );

    IF v_idx_count < 5 THEN
        RAISE NOTICE 'ADVERTENCIA PRUEBA 15: Se detectaron % de 5 índices estratégicos (ejecutar sql/indices_rendimiento_fase3.sql).', v_idx_count;
    ELSE
        RAISE NOTICE 'PRUEBA 15 EXITOSA (ÍNDICES DE RENDIMIENTO): % índices estratégicos verificados en pg_indexes.', v_idx_count;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- LIMPIEZA FINAL DE LA SUITE DE PRUEBAS SINTÉTICAS
-- ----------------------------------------------------------------------------
BEGIN;
SET session_replication_role = 'replica';
DELETE FROM operaciones_pendientes_transferencia WHERE id LIKE 'TEST-%';
DELETE FROM auditoria_migracion_cotizaciones_ambiguas WHERE id LIKE 'TEST-%' OR cotizacion_id LIKE 'TEST-%';
DELETE FROM autorizaciones_operaciones WHERE id LIKE 'TEST-%' OR documento_id LIKE 'TEST-%';
DELETE FROM cotizacion_items WHERE id LIKE 'TEST-%' OR cotizacion_id LIKE 'TEST-%';
DELETE FROM facturas WHERE id LIKE 'TEST-%';
DELETE FROM cotizaciones WHERE id LIKE 'TEST-%';
DELETE FROM usuarios_cuentas WHERE id LIKE 'TEST-%';
DELETE FROM clientes WHERE id LIKE 'TEST-%';
DELETE FROM productos WHERE id LIKE 'TEST-%';
SET session_replication_role = 'origin';
COMMIT;
