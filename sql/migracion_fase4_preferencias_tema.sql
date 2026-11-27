-- ============================================================================
-- FERRETERÍA EMMANUEL — MIGRACIÓN FASE 4: SINCRONIZACIÓN PERSISTENTE DE TEMAS
-- ============================================================================
-- Agrega columna 'tema' a usuarios_cuentas para almacenar la preferencia visual
-- de cada usuario de forma independiente y sincronizable entre dispositivos.
-- ============================================================================

ALTER TABLE usuarios_cuentas 
    ADD COLUMN IF NOT EXISTS tema TEXT NOT NULL DEFAULT 'emmanuel';

CREATE INDEX IF NOT EXISTS idx_usuarios_cuentas_tema 
    ON usuarios_cuentas(tema);
