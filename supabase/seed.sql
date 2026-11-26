-- Catálogo mínimo. El ejemplar local de demostración (data/bodega.json)
-- trae además solicitudes, actas y kárdex listos para revisar el flujo.

insert into oficinas (id, nombre, tipo) values
  ('11111111-1111-4111-8111-111111111111', 'Dirección Administrativa', 'OFICINA'),
  ('22222222-2222-4222-8222-222222222222', 'Oficina de Compras', 'OFICINA'),
  ('33333333-3333-4333-8333-333333333333', 'Taller de Mantenimiento', 'DEPENDENCIA'),
  ('44444444-4444-4444-8444-444444444444', 'Bodega Central', 'DEPENDENCIA'),
  ('55555555-5555-4555-8555-555555555555', 'Jefatura de Obras', 'OFICINA'),
  ('66666666-6666-4666-8666-666666666666', 'Servicios Generales', 'DEPENDENCIA')
on conflict (nombre) do nothing;

insert into productos (codigo, nombre, unidad_medida, inventario_inicial, stock_actual) values
  ('FE-001', 'Clavo de acero 2 pulgadas', 'UNIDAD', 200, 200),
  ('FE-002', 'Clavo de acero 3 pulgadas', 'UNIDAD', 150, 150),
  ('FE-003', 'Alambre galvanizado calibre 14', 'METRO', 500, 500),
  ('FE-004', 'Cemento gris de uso general', 'BOLSA', 40, 40),
  ('FE-007', 'Thinner estándar', 'LITRO', 36, 36),
  ('FE-008', 'Cable THW calibre 12', 'METRO', 400, 400),
  ('FE-010', 'Disco de corte 4 1/2', 'UNIDAD', 80, 80),
  ('FE-011', 'Guantes de cuero', 'PAR', 40, 40),
  ('FE-012', 'Casco de seguridad', 'UNIDAD', 25, 25)
on conflict (codigo) do nothing;
