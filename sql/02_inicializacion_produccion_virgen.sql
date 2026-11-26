-- ============================================================================
-- FERRETERÍA EMMANUEL — INICIALIZACIÓN OFICIAL VIRGEN PARA PRODUCCIÓN
-- Base de Datos: PostgreSQL / Neon Serverless en Vercel
-- Estado: 100% Virgen (Sin transacciones comerciales ni datos demo)
-- ============================================================================

BEGIN;

-- 1. CONFIGURACIÓN FISCAL Y EMPRESARIAL OFICIAL (IVA AL 0.00%)
INSERT INTO configuracion_sistema (
    id,
    nombre_empresa,
    ruc,
    direccion,
    telefono,
    correo,
    moneda,
    simbolo_moneda,
    iva_porcentaje,
    pie_factura,
    modo_auditoria_estricto,
    permitir_stock_negativo,
    actualizado_en
) VALUES (
    'config_general',
    'Ferretería Emmanuel',
    'J0310000000000',
    'Managua, Nicaragua',
    '+505 2222-0000',
    'contacto@ferreteriaemmanuel.com.ni',
    'CORDOBAS',
    'C$',
    0.00,
    '¡Gracias por su compra en Ferretería Emmanuel!',
    false,
    false,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    nombre_empresa = EXCLUDED.nombre_empresa,
    iva_porcentaje = 0.00,
    moneda = 'CORDOBAS',
    simbolo_moneda = 'C$';

-- 2. FOLIOS Y CONSECUTIVOS INICIALES (EN CERO)
INSERT INTO consecutivos_folios (tipo, ultimo_numero, actualizado_en) VALUES
    ('FAC', 0, NOW()),
    ('COT', 0, NOW()),
    ('ORD', 0, NOW()),
    ('REC', 0, NOW()),
    ('DEV', 0, NOW()),
    ('ACT', 0, NOW()),
    ('MOV', 0, NOW()),
    ('TUR', 0, NOW()),
    ('GAS', 0, NOW())
ON CONFLICT (tipo) DO UPDATE SET
    ultimo_numero = EXCLUDED.ultimo_numero;

-- 3. ÚNICO USUARIO ADMINISTRADOR INICIAL (CON OBLIGACIÓN DE CAMBIO DE CONTRASEÑA)
-- Almacena exclusivamente el hash criptográfico seguro (KDF scrypt).
-- Durante el primer acceso, el sistema exige inmediatamente el cambio a su contraseña personal definitiva.
INSERT INTO usuarios_cuentas (
    id,
    usuario,
    nombre,
    rol,
    clave,
    activo,
    correo,
    debe_cambiar_clave,
    version_credencial,
    intentos_fallidos,
    creado_en,
    actualizado_en
) VALUES (
    'usr_admin_master',
    'admin',
    'Administrador General',
    'admin',
    '$scrypt$s=845edbf5a86c5b421edd750e3a025897$h=5e74355425b29edcccb99599f36f807bb03af5f6e6ae47e3baaf324d052ec06862f5869b82f5a5f6c7efc2fc2c8338c5c50eac87c546b35553aa765d88937fc3',
    true,
    'admin@ferreteriaemmanuel.com.ni',
    true,
    1,
    0,
    NOW(),
    NOW()
) ON CONFLICT (usuario) DO UPDATE SET
    nombre = 'Administrador General',
    rol = 'admin',
    clave = EXCLUDED.clave,
    activo = true,
    debe_cambiar_clave = true;

COMMIT;
