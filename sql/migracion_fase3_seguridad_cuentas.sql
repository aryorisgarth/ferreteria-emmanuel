-- ============================================================================
-- FERRETERÍA EMMANUEL — MIGRACIÓN FASE 3: SEGURIDAD Y PROTECCIÓN DE CUENTAS
-- ============================================================================
-- Agrega soporte de persistencia para mitigación de fuerza bruta y auditoría.
-- NO EJECUTAR DIRECTAMENTE — Preparada para su aplicación planificada en Fase 3.1.

ALTER TABLE usuarios_cuentas 
    ADD COLUMN IF NOT EXISTS intentos_fallidos INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_usuarios_cuentas_bloqueo 
    ON usuarios_cuentas(bloqueado_hasta) 
    WHERE bloqueado_hasta IS NOT NULL;
