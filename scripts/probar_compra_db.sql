-- Prueba de compra con recálculo de Costo Promedio Ponderado (CPP)
SELECT public.registrar_compra_transaccional(
  'test_compra_local_001'::text,
  'd0000001-0000-0000-0000-000000000001'::uuid,
  'CEMEX Nicaragua, S.A.'::text,
  current_date,
  'Reabastecimiento de cemento tolteca'::text,
  'admin'::text,
  '[{"producto_id": "a0000001-0000-0000-0000-000000000001", "cantidad": 60, "costo_unitario": 350.00, "observacion": "Lote CEMEX 941"}]'::jsonb
);
