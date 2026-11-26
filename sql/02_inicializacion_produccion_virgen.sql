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
    '$scrypt$s=97aefb8f300e82c4e732d7dcc368480f$h=c9094e72726b87e86beb2b55a173d58a04c8d61121f7bba41d7a1ce31de5d7c25b8a0d74398e0a5b1b10ef597ed0ce411ad87bcb8d5940546c8927188e2ab3e1',
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
