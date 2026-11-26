-- Seed completo para base de datos local PostgreSQL
-- Ferretería Emmanuel

-- 1. Oficinas y Dependencias
insert into oficinas (id, nombre, tipo) values
  ('11111111-1111-4111-8111-111111111111', 'Dirección Administrativa', 'OFICINA'),
  ('22222222-2222-4222-8222-222222222222', 'Oficina de Compras', 'OFICINA'),
  ('33333333-3333-4333-8333-333333333333', 'Taller de Mantenimiento', 'DEPENDENCIA'),
  ('44444444-4444-4444-8444-444444444444', 'Bodega Central', 'DEPENDENCIA'),
  ('55555555-5555-4555-8555-555555555555', 'Jefatura de Obras', 'OFICINA'),
  ('66666666-6666-4666-8666-666666666666', 'Servicios Generales', 'DEPENDENCIA')
on conflict (nombre) do nothing;

-- 2. Catálogo de Artículos de Ferretería
insert into productos (
  id, codigo, nombre, unidad_medida, inventario_inicial, stock_actual,
  costo, precio, categoria, marca, stock_minimo, activo
) values
  ('a0000001-0000-0000-0000-000000000001', 'MAT-CEM-01', 'Cemento Canal Tolteca 42.5 kg Gris', 'BOLSA', 450, 450, 310.00, 380.00, 'Construcción', 'Tolteca', 50, true),
  ('a0000002-0000-0000-0000-000000000002', 'MAT-VAR-38', 'Varilla Corrugada 3/8" Grado 40 (6m)', 'METRO', 320, 320, 132.00, 165.00, 'Construcción', 'Gerdau', 100, true),
  ('a0000003-0000-0000-0000-000000000003', 'MAT-ALAM-18', 'Alambre de Amarre Negro Cal. 18', 'LIBRA', 18, 18, 1180.00, 1450.00, 'Construcción', 'Del Sol', 5, true),
  ('a0000004-0000-0000-0000-000000000004', 'BLOQ-EST-04', 'Bloque de Concreto 4x8x16 Estándar', 'UNIDAD', 1850, 1850, 17.50, 22.00, 'Construcción', 'Premix', 300, true),
  ('a0000005-0000-0000-0000-000000000005', 'PVC-SAN-3X6', 'Tubo PVC Sanitario 3" x 6m SDR-41', 'METRO', 85, 85, 335.00, 420.00, 'Plomería', 'Amanco', 20, true),
  ('a0000006-0000-0000-0000-000000000006', 'PEG-TAN-250', 'Pegamento para PVC Tangit 250ml', 'UNIDAD', 42, 42, 145.00, 185.00, 'Plomería', 'Henkel', 15, true),
  ('a0000007-0000-0000-0000-000000000007', 'PIN-COR-B5G', 'Pintura Corona Blanco Galón 5G', 'GALON', 24, 24, 2280.00, 2850.00, 'Pintura', 'Corona', 10, true),
  ('a0000008-0000-0000-0000-000000000008', 'HER-MAR-TRU', 'Martillo Truper Fibra Vidrio 16oz', 'UNIDAD', 16, 16, 215.00, 285.00, 'Herramientas', 'Truper', 8, true),
  ('a0000009-0000-0000-0000-000000000009', 'ELE-CAB-12', 'Cable THHN #12 Awg Rollo 100m', 'ROLLO', 9, 9, 1980.00, 2490.00, 'Eléctrico', 'Condumex', 10, true),
  ('a0000010-0000-0000-0000-000000000010', 'VAL-BRO-12', 'Llave de Pase 1/2" Bronce Pesada', 'UNIDAD', 58, 58, 95.00, 135.00, 'Plomería', 'Urrea', 15, true),
  ('a0000011-0000-0000-0000-000000000011', 'HER-ALA-TRU', 'Alicate Universal 8" Truper Mango Ergo', 'UNIDAD', 25, 25, 140.00, 195.00, 'Herramientas', 'Truper', 5, true),
  ('a0000012-0000-0000-0000-000000000012', 'PIN-BRO-04', 'Brocha de Cerda Natural 4" Corona Pro', 'UNIDAD', 35, 35, 85.00, 125.00, 'Pintura', 'Corona', 10, true)
on conflict (codigo) do update set
  precio = excluded.precio,
  costo = excluded.costo,
  stock_actual = excluded.stock_actual,
  categoria = excluded.categoria,
  marca = excluded.marca,
  stock_minimo = excluded.stock_minimo;

-- 3. Clientes Frecuentes
insert into clientes (id, nombre, ruc_cedula, telefono, direccion, limite_credito, notas, activo) values
  ('c0000001-0000-0000-0000-000000000001', 'Constructora & Multiservicios San Jerónimo, S.A.', 'J0310000184920', '+505 2278-1122', 'Residencial Las Colinas, Managua', 150000.00, 'Cliente corporativo crédito A', true),
  ('c0000002-0000-0000-0000-000000000002', 'Ing. Roberto Alemán Fonseca', '001-150882-0004T', '+505 8744-1234', 'Reparto San Juan, Managua', 50000.00, 'Urbanizador frecuente', true),
  ('c0000003-0000-0000-0000-000000000003', 'Distribuidora Ferretera del Norte', 'J0510000094831', '+505 2772-5500', 'Matagalpa central', 200000.00, 'Distribuidor mayorista', true)
on conflict (id) do nothing;

-- 4. Proveedores Oficiales
insert into proveedores (id, nombre, ruc, contacto, telefono, direccion, notas, activo) values
  ('d0000001-0000-0000-0000-000000000001', 'CEMEX Nicaragua, S.A.', 'J0310000001234', 'Lic. Marcos Palacios', '+505 2255-8000', 'Km 7.5 Carretera Norte, Managua', 'Distribuidor de cemento gris', true),
  ('d0000002-0000-0000-0000-000000000002', 'Corporación Aceros de Centroamérica (Gerdau)', 'J0310000005678', 'Ing. Gabriel Rivas', '+505 2269-9000', 'Zona Franca Las Mercedes, Managua', 'Acero estructural y mallas', true),
  ('d0000003-0000-0000-0000-000000000003', 'Wavin Amanco Nicaragua', 'J0310000009999', 'Ing. Brenda Duarte', '+505 2263-1200', 'Km 11 Carretera Vieja a León', 'Tuberías y accesorios sanitarios', true)
on conflict (nombre) do nothing;

-- 5. Turno de Caja Inicial (Abierto para Pruebas del POS)
insert into turnos_caja (id, numero, usuario, fecha_apertura, monto_inicial, estado, notas) values
  ('e0000001-0000-0000-0000-000000000001', 'TUR-2026-0001', 'cajero', now(), 2000.00, 'ABIERTO', 'Turno matutino de prueba local')
on conflict (id) do nothing;
