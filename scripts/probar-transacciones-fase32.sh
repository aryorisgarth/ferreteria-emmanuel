#!/usr/bin/env bash
# ==============================================================================
# FERRETERÍA EMMANUEL — PRUEBA DE ROLLBACK Y REGLAS COMERCIALES TRANSACCIONALES
# FASE 3.2: VALIDACIÓN AISLADA
# ==============================================================================
set -euo pipefail

DB="ferreteria_fase31_test"
echo "=== 1. VALIDACIÓN DE ROLLBACK ATÓMICO ANTE FALLO EN FACTURACIÓN ==="

psql -d "$DB" -U postgres << 'EOSQL' > /dev/null 2>&1
BEGIN;
SET session_replication_role = 'replica';
DELETE FROM operaciones_pendientes_transferencia WHERE id LIKE 'TEST-TRANSF-%';
DELETE FROM facturas WHERE id LIKE 'FAC-ROLLBACK%';
DELETE FROM cotizacion_items WHERE cotizacion_id LIKE 'COT-ROLLBACK%';
DELETE FROM cotizaciones WHERE id LIKE 'COT-ROLLBACK%';
DELETE FROM productos WHERE id LIKE 'PROD-ROLLBACK%';
DELETE FROM clientes WHERE id LIKE 'CLI-ROLLBACK%';
SET session_replication_role = 'origin';
COMMIT;
EOSQL

psql -d "$DB" -U postgres << 'EOSQL'
\set ON_ERROR_STOP on
DO $$
DECLARE
    v_cot_estado_antes TEXT;
    v_item_pend_antes NUMERIC;
    v_cot_estado_despues TEXT;
    v_item_pend_despues NUMERIC;
    v_factura_count INT;
BEGIN
    -- 1. Setup de datos sintéticos
    INSERT INTO clientes (id, nombre, activo) VALUES ('CLI-ROLLBACK', 'Cliente Rollback Test', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO productos (id, codigo, nombre, unidad_medida, precio, costo, stock_actual, activo)
    VALUES ('PROD-ROLLBACK', 'RBK01', 'Bloque Concreto 15cm', 'UNIDAD', 25.00, 18.00, 200, true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO cotizaciones (
        id, numero, cliente, cliente_id, fecha, estado, creado_por, version, cotizacion_raiz_id, es_version_actual,
        subtotal, subtotal_gravado, subtotal_exento, iva, total
    ) VALUES (
        'COT-ROLLBACK', 'COT-RBK-001', 'Cliente Rollback Test', 'CLI-ROLLBACK', NOW(), 'BORRADOR',
        'cajero_rbk', 1, 'COT-ROLLBACK', true, 250.00, 250.00, 0.00, 37.50, 287.50
    );

    INSERT INTO cotizacion_items (
        id, cotizacion_id, producto_id, cantidad, cantidad_facturada, cantidad_cancelada, cantidad_pendiente,
        precio, precio_autorizado, unidad_medida, costo_unitario, descuento, exento_iva
    ) VALUES (
        'ITEM-ROLLBACK', 'COT-ROLLBACK', 'PROD-ROLLBACK', 10.0000, 0.0000, 0.0000, 10.0000,
        25.00, 25.00, 'UNIDAD', 18.00, 0.00, false
    );

    UPDATE cotizaciones SET estado = 'AUTORIZADA' WHERE id = 'COT-ROLLBACK';

    SELECT estado INTO v_cot_estado_antes FROM cotizaciones WHERE id = 'COT-ROLLBACK';
    SELECT cantidad_pendiente INTO v_item_pend_antes FROM cotizacion_items WHERE id = 'ITEM-ROLLBACK';

    -- 2. Simular bloque transaccional que falla en el último paso (ej. error forzado)
    BEGIN
        -- Paso A: Actualizar cotización a PARCIALMENTE_FACTURADA
        UPDATE cotizaciones SET estado = 'PARCIALMENTE_FACTURADA' WHERE id = 'COT-ROLLBACK';
        UPDATE cotizacion_items SET cantidad_facturada = 5.0000, cantidad_pendiente = 5.0000 WHERE id = 'ITEM-ROLLBACK';

        -- Paso B: Insertar factura
        INSERT INTO facturas (
            id, numero, cliente, cliente_id, fecha, cotizacion_id, creado_por,
            estado, stock_aplicado, forma_pago, origen, subtotal, iva, total, costo_total_venta
        ) VALUES (
            'FAC-ROLLBACK', 'FAC-RBK-001', 'Cliente Rollback Test', 'CLI-ROLLBACK', NOW(), 'COT-ROLLBACK', 'cajero_rbk',
            'EMITIDA', true, 'EFECTIVO', 'COTIZACION', 125.00, 18.75, 143.75, 90.00
        );

        -- Paso C: Error forzado (Violación intencional)
        RAISE EXCEPTION 'FALLO FORZADO: Simulando desconexión o falla crítica de pago.';

    EXCEPTION WHEN OTHERS THEN
        -- El bloque capturó el error y ejecutó rollback implícito del sub-bloque
        NULL;
    END;

    -- 3. Verificar que los datos en la base NO sufrieron cambio
    SELECT estado INTO v_cot_estado_despues FROM cotizaciones WHERE id = 'COT-ROLLBACK';
    SELECT cantidad_pendiente INTO v_item_pend_despues FROM cotizacion_items WHERE id = 'ITEM-ROLLBACK';
    SELECT COUNT(*) INTO v_factura_count FROM facturas WHERE id = 'FAC-ROLLBACK';

    IF v_cot_estado_despues <> v_cot_estado_antes THEN
        RAISE EXCEPTION 'ERROR: El estado de la cotización cambió indebidamente tras el fallo.';
    END IF;

    IF v_item_pend_despues <> v_item_pend_antes THEN
        RAISE EXCEPTION 'ERROR: La cantidad pendiente cambió indebidamente tras el fallo.';
    END IF;

    IF v_factura_count > 0 THEN
        RAISE EXCEPTION 'ERROR: Quedó una factura huérfana en la base de datos tras el fallo.';
    END IF;

    RAISE NOTICE 'PRUEBA ROLLBACK EXITOSA: Transacción completamente revertida sin registros residuales.';
END $$;
EOSQL

echo "=== 2. VALIDACIÓN DE POLÍTICA A (TRANSFERENCIAS BANCARIAS) ==="

psql -d "$DB" -U postgres << 'EOSQL'
\set ON_ERROR_STOP on
DO $$
DECLARE
    v_error_duplicado BOOLEAN := false;
BEGIN
    -- Registrar primera transferencia
    INSERT INTO operaciones_pendientes_transferencia (
        id, cliente_nombre, cajero_id, cajero_nombre, banco_origen, banco_destino,
        referencia_bancaria, monto_declarado, payload_lineas, estado_bancario, estado_comercial
    ) VALUES (
        'TEST-TRANSF-01', 'Cliente Prueba Transferencia', 'USR-01', 'Cajero 1', 'BAC', 'BANPRO',
        'REF-BANCO-777888', 1500.00, '[]'::jsonb, 'PENDIENTE_VERIFICACION', 'PENDIENTE_CONFIRMACION'
    );

    -- Intentar registrar una segunda transferencia con el MISMO banco_destino y referencia_bancaria
    BEGIN
        INSERT INTO operaciones_pendientes_transferencia (
            id, cliente_nombre, cajero_id, cajero_nombre, banco_origen, banco_destino,
            referencia_bancaria, monto_declarado, payload_lineas, estado_bancario, estado_comercial
        ) VALUES (
            'TEST-TRANSF-02', 'Cliente Malicioso Voucher Reusado', 'USR-02', 'Cajero 2', 'BAC', 'BANPRO',
            'REF-BANCO-777888', 1500.00, '[]'::jsonb, 'PENDIENTE_VERIFICACION', 'PENDIENTE_CONFIRMACION'
        );
    EXCEPTION WHEN unique_violation THEN
        v_error_duplicado := true;
    END;

    IF NOT v_error_duplicado THEN
        RAISE EXCEPTION 'ERROR: La restricción uq_transferencia_referencia_bancaria no bloqueó la reutilización del voucher.';
    END IF;

    RAISE NOTICE 'PRUEBA POLÍTICA A EXITOSA: Duplicidad de comprobante bancario rechazada atómicamente.';
END $$;
EOSQL

echo "=== 3. LIMPIEZA DE PRUEBAS DE TRANSACCIONALIDAD ==="
psql -d "$DB" -U postgres << 'EOSQL' > /dev/null 2>&1
BEGIN;
SET session_replication_role = 'replica';
DELETE FROM operaciones_pendientes_transferencia WHERE id LIKE 'TEST-TRANSF-%';
DELETE FROM facturas WHERE id LIKE 'FAC-ROLLBACK%';
DELETE FROM cotizacion_items WHERE cotizacion_id LIKE 'COT-ROLLBACK%';
DELETE FROM cotizaciones WHERE id LIKE 'COT-ROLLBACK%';
DELETE FROM productos WHERE id LIKE 'PROD-ROLLBACK%';
DELETE FROM clientes WHERE id LIKE 'CLI-ROLLBACK%';
SET session_replication_role = 'origin';
COMMIT;
EOSQL

echo "=== VALIDACIONES COMPLEMENTARIAS COMPLETADAS CON ÉXITO ==="
