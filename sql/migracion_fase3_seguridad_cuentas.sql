-- ============================================================================
-- FERRETERÍA EMMANUEL — MIGRACIÓN FASE 3: SEGURIDAD Y PROTECCIÓN DE CUENTAS
-- ============================================================================
-- Agrega soporte de persistencia para autenticación segura, cambio obligatorio
-- de clave, recuperación de contraseña, mitigación de fuerza bruta y auditoría.
-- ============================================================================

ALTER TABLE usuarios_cuentas 
    ADD COLUMN IF NOT EXISTS correo TEXT,
    ADD COLUMN IF NOT EXISTS debe_cambiar_clave BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS version_credencial INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS token_recuperacion_hash TEXT,
    ADD COLUMN IF NOT EXISTS token_recuperacion_expira TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS intentos_fallidos INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_usuarios_cuentas_bloqueo 
    ON usuarios_cuentas(bloqueado_hasta) 
    WHERE bloqueado_hasta IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_cuentas_correo 
    ON usuarios_cuentas(correo) 
    WHERE correo IS NOT NULL;
