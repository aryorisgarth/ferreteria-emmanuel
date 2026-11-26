#!/usr/bin/env bash
# ==============================================================================
# FERRETERÍA EMMANUEL — PRUEBA DE CONCURRENCIA REAL CON 2 CONEXIONES POSTGRESQL
# FASE 3.2: VALIDACIÓN TRANSACCIONAL AISLADA
# ==============================================================================
set -euo pipefail

DB="ferreteria_fase31_test"
echo "=== 1. PREPARANDO DATOS DE PRUEBA DE CONCURRENCIA ==="

TMP_DIR=$(mktemp -d)
SQL_PREP="$TMP_DIR/prep.sql"
SQL_CONN1="$TMP_DIR/conn1.sql"
SQL_CONN2="$TMP_DIR/conn2.sql"
LOG_CONN1="$TMP_DIR/conn1.log"
LOG_CONN2="$TMP_DIR/conn2.log"

cat << 'EOF' > "$SQL_PREP"
BEGIN;
SET session_replication_role = 'replica';
DELETE FROM cotizacion_items WHERE cotizacion_id = 'COT-CONCURRENTE';
DELETE FROM cotizaciones WHERE id = 'COT-CONCURRENTE';
DELETE FROM facturas WHERE cotizacion_id = 'COT-CONCURRENTE';
DELETE FROM productos WHERE id = 'PROD-CONCURRENTE';
DELETE FROM clientes WHERE id = 'CLI-CONCURRENTE';
SET session_replication_role = 'origin';

INSERT INTO clientes (id, nombre, activo)
VALUES ('CLI-CONCURRENTE', 'Constructora Paralela S.A.', true);

INSERT INTO productos (id, codigo, nombre, unidad_medida, precio, costo, stock_actual, activo)
VALUES ('PROD-CONCURRENTE', 'CONC01', 'Tubo PVC 1/2 pulgada', 'TUBO', 120.00, 80.00, 100, true);

INSERT INTO cotizaciones (
    id, numero, cliente, cliente_id, fecha, estado, notas, creado_por, version, cotizacion_raiz_id, es_version_actual,
    subtotal, subtotal_gravado, subtotal_exento, iva, total
) VALUES (
    'COT-CONCURRENTE', 'COT-CONC-2026', 'Constructora Paralela S.A.', 'CLI-CONCURRENTE', NOW(), 'BORRADOR',
    'Cotización para prueba de concurrencia', 'cajero_1', 1, 'COT-CONCURRENTE', true,
    1200.00, 1200.00, 0.00, 180.00, 1380.00
);

INSERT INTO cotizacion_items (
    id, cotizacion_id, producto_id, cantidad, cantidad_facturada, cantidad_cancelada, cantidad_pendiente,
    precio, precio_autorizado, unidad_medida, costo_unitario, descuento, exento_iva
) VALUES (
    'ITEM-CONCURRENTE', 'COT-CONCURRENTE', 'PROD-CONCURRENTE', 10.0000, 0.0000, 0.0000, 10.0000,
    120.00, 120.00, 'TUBO', 80.00, 0.00, false
);

UPDATE cotizaciones SET estado = 'AUTORIZADA' WHERE id = 'COT-CONCURRENTE';
COMMIT;
EOF

psql -d "$DB" -U postgres -v ON_ERROR_STOP=1 -f "$SQL_PREP"
echo "=== Datos preparados: Cotización con 10 unidades pendientes ==="

# Conexión 1: Bloquea el ítem FOR UPDATE, procesa durante 1.5s y factura 6 unidades.
cat << 'EOF' > "$SQL_CONN1"
BEGIN;
SELECT pg_sleep(0.1);
-- Bloqueo exclusivo del ítem cotizado
SELECT id, cantidad, cantidad_facturada, cantidad_pendiente 
FROM cotizacion_items 
WHERE id = 'ITEM-CONCURRENTE' 
FOR UPDATE;

-- Simula retardo de cobro/cálculo
SELECT pg_sleep(1.5);

-- Facturación de 6 unidades
UPDATE cotizacion_items
SET cantidad_facturada = cantidad_facturada + 6.0000,
    cantidad_pendiente = cantidad_pendiente - 6.0000
WHERE id = 'ITEM-CONCURRENTE';

UPDATE cotizaciones
SET estado = 'PARCIALMENTE_FACTURADA'
WHERE id = 'COT-CONCURRENTE';

COMMIT;
EOF

# Conexión 2: Intenta facturar 8 unidades en paralelo.
# Debe esperar el lock de Conexión 1, despertar y evaluar si 8 <= pendiente.
cat << 'EOF' > "$SQL_CONN2"
\set ON_ERROR_STOP on
DO $$
DECLARE
    v_item RECORD;
BEGIN
    PERFORM pg_sleep(0.4); -- Arranca en paralelo mientras conn1 tiene el lock
    
    -- Bloqueo FOR UPDATE (esperará a que conn1 haga COMMIT)
    SELECT * INTO v_item 
    FROM cotizacion_items 
    WHERE id = 'ITEM-CONCURRENTE' 
    FOR UPDATE;

    -- Al despertar del lock, comprueba el saldo pendiente actualizado
    IF v_item.cantidad_pendiente < 8.0000 THEN
        RAISE EXCEPTION 'RECHAZO CONCURRENTE ESPERADO: Saldo pendiente insuficiente (Solicitado: 8, Disponible: %)', v_item.cantidad_pendiente;
    ELSE
        -- Si permitiera facturar 8 cuando solo quedaban 4, violaría el balance
        UPDATE cotizacion_items
        SET cantidad_facturada = cantidad_facturada + 8.0000,
            cantidad_pendiente = cantidad_pendiente - 8.0000
        WHERE id = 'ITEM-CONCURRENTE';
    END IF;
END $$;
EOF

echo "=== 2. EJECUTANDO CONEXIONES CONCURRENTES EN PARALELO ==="

psql -d "$DB" -U postgres -f "$SQL_CONN1" > "$LOG_CONN1" 2>&1 &
PID1=$!

psql -d "$DB" -U postgres -f "$SQL_CONN2" > "$LOG_CONN2" 2>&1 &
PID2=$!

# Esperar la finalización de ambas sesiones independientes
wait $PID1 || true
wait $PID2 || true

echo "=== 3. ANALIZANDO RESULTADOS DE AMBAS CONEXIONES ==="
echo "--- LOG CONEXIÓN 1 ---"
cat "$LOG_CONN1"
echo "--- LOG CONEXIÓN 2 ---"
cat "$LOG_CONN2"

echo "=== 4. VERIFICANDO INTEGRIDAD DEL BALANCE FINAL EN POSTGRESQL ==="
psql -d "$DB" -U postgres -c "SELECT id, estado FROM cotizaciones WHERE id = 'COT-CONCURRENTE';"
psql -d "$DB" -U postgres -c "SELECT id, cantidad, cantidad_facturada, cantidad_cancelada, cantidad_pendiente FROM cotizacion_items WHERE id = 'ITEM-CONCURRENTE';"

# Validación de éxito
if grep -q "RECHAZO CONCURRENTE ESPERADO" "$LOG_CONN2"; then
    echo ">>> EXCELENTE: Conexión 2 esperó atómicamente a Conexión 1 y rechazó la sobre-facturación."
    EXIT_CODE=0
else
    echo ">>> ERROR: No se detectó el rechazo esperado."
    EXIT_CODE=1
fi

# Limpieza preventiva final
cat << 'EOF' > "$SQL_PREP"
BEGIN;
SET session_replication_role = 'replica';
DELETE FROM cotizacion_items WHERE cotizacion_id = 'COT-CONCURRENTE';
DELETE FROM cotizaciones WHERE id = 'COT-CONCURRENTE';
DELETE FROM productos WHERE id = 'PROD-CONCURRENTE';
DELETE FROM clientes WHERE id = 'CLI-CONCURRENTE';
SET session_replication_role = 'origin';
COMMIT;
EOF
psql -d "$DB" -U postgres -f "$SQL_PREP" > /dev/null 2>&1

rm -rf "$TMP_DIR"
exit $EXIT_CODE
