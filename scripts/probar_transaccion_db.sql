-- Prueba de transacción real de venta con descuento y descargo de inventario
SELECT public.emitir_factura_transaccional(
  'test_tx_local_001'::text,
  'c0000001-0000-0000-0000-000000000001'::uuid,
  'Constructora San Jerónimo'::text,
  current_date,
  'EFECTIVO'::text,
  NULL::uuid,
  'Factura de prueba local'::text,
  'cajero'::text,
  'CAJERO'::text,
  '[{"producto_id": "a0000001-0000-0000-0000-000000000001", "cantidad": 10, "descuento_solicitado": 2, "observacion": "Prueba transaccional"}]'::jsonb,
  15.00
);
