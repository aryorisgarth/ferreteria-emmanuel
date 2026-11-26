-- =============================================================================
-- FERRETERÍA EMMANUEL — FUNCIONES TRANSACCIONALES DE VENTA Y COMPRA
-- Archivo de Definición SQL para Supabase / PostgreSQL 15+
-- NOTA OBLIGATORIA: ARCHIVO DE CÓDIGO FUENTE. NO SE EJECUTA EN ESTA ETAPA.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Función RPC: emitir_factura_transaccional
--
-- Reglas de Negocio Implementadas:
-- - Idempotencia absoluta mediante p_idempotency_key (previene cobros duplicados).
-- - El cliente NUNCA envía precios finales: solo (producto_id, cantidad, descuento_solicitado).
-- - El precio oficial se extrae con bloqueo FOR UPDATE directamente de la tabla 'productos'.
-- - Si el descuento_solicitado > 0 y el rol NO es ADMINISTRADOR, se valida contra el umbral.
-- - Previene sobreventa mediante verificación de stock bloqueado.
-- - Si la venta es a CRÉDITO, verifica y actualiza de forma atómica el saldo deudor del cliente
--   respetando su límite de crédito configurado.
-- - Si existe turno de caja ABIERTO, acumula automáticamente el total en efectivo o tarjeta.
-- - Registra los movimientos de SALIDA en el kárdex (kardex_movimientos) con llave idempotente.
-- - Si cualquier validación falla, PostgreSQL realiza ROLLBACK atómico instantáneo.
-- -----------------------------------------------------------------------------

create or replace function public.emitir_factura_transaccional(
  p_idempotency_key text,
  p_cliente_id uuid,
  p_cliente_nombre text,
  p_fecha date,
  p_forma_pago text,
  p_cotizacion_id uuid,
  p_notas text,
  p_creado_por text,
  p_rol_usuario text,
  p_items jsonb, -- Array de { producto_id: uuid, cantidad: numeric, descuento_solicitado: numeric, observacion?: text }
  p_tasa_iva numeric default 15.00
) returns jsonb as $$
declare
  v_factura_existente record;
  v_factura_id uuid;
  v_numero_factura text;
  v_item record;
  v_producto record;
  v_cliente record;
  v_turno record;
  v_cantidad numeric(14, 3);
  v_precio_oficial numeric(14, 2);
  v_descuento_pct numeric(5, 2);
  v_precio_final numeric(14, 2);
  v_subtotal_linea numeric(14, 2);
  v_subtotal_gravable numeric(14, 2) := 0;
  v_descuento_total numeric(14, 2) := 0;
  v_impuesto_total numeric(14, 2) := 0;
  v_total_factura numeric(14, 2) := 0;
  v_llave_kardex text;
begin
  -- 1. Idempotencia: Verificar si ya fue procesada esta operación
  select id, numero, total into v_factura_existente
  from public.facturas
  where idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'status', 'OK',
      'idempotente', true,
      'factura_id', v_factura_existente.id,
      'numero', v_factura_existente.numero,
      'mensaje', 'Operación previamente completada con éxito.'
    );
  end if;

  -- 2. Validaciones iniciales
  if p_cliente_nombre is null or length(trim(p_cliente_nombre)) < 2 then
    raise exception 'Debe indicar un nombre válido para el cliente.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Debe incluir al menos un artículo en la factura.';
  end if;

  if p_forma_pago not in ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO') then
    raise exception 'Forma de pago inválida: %', p_forma_pago;
  end if;

  -- 3. Si es a CRÉDITO, validar cliente y bloquear registro de crédito
  if p_forma_pago = 'CREDITO' then
    if p_cliente_id is null then
      raise exception 'Las ventas a crédito requieren un cliente registrado con límite autorizado.';
    end if;

    select * into v_cliente
    from public.clientes
    where id = p_cliente_id and activo = true
    for update;

    if not found then
      raise exception 'Cliente no encontrado o inactivo para venta al crédito.';
    end if;
  end if;

  -- 4. Generar consecutivo oficial de factura
  v_numero_factura := public.siguiente_numero('FAC', 'secuencia_factura');
  v_factura_id := gen_random_uuid();

  -- 5. Crear cabecera preliminar de factura
  insert into public.facturas (
    id, numero, cliente, cliente_id, fecha, cotizacion_id,
    notas, creado_por, estado, stock_aplicado, forma_pago,
    idempotency_key, subtotal, descuento, impuesto, total
  ) values (
    v_factura_id, v_numero_factura, trim(p_cliente_nombre), p_cliente_id, p_fecha, p_cotizacion_id,
    coalesce(p_notas, ''), p_creado_por, case when p_forma_pago = 'CREDITO' then 'EMITIDA' else 'PAGADA' end,
    false, p_forma_pago, p_idempotency_key, 0, 0, 0, 0
  );

  -- 6. Procesar cada ítem con BLOQUEO FOR UPDATE en productos
  for v_item in select * from jsonb_to_recordset(p_items) as x(
    producto_id uuid,
    cantidad numeric,
    descuento_solicitado numeric,
    observacion text
  )
  loop
    v_cantidad := coalesce(v_item.cantidad, 0);
    if v_cantidad <= 0 then
      raise exception 'La cantidad de cada artículo debe ser mayor que cero.';
    end if;

    -- Bloqueo pesimista del producto
    select * into v_producto
    from public.productos
    where id = v_item.producto_id and activo = true
    for update;

    if not found then
      raise exception 'Artículo no encontrado o inactivo: %', v_item.producto_id;
    end if;

    -- Prevenir sobreventa
    if v_producto.stock_actual < v_cantidad then
      raise exception 'Existencia insuficiente para "%" (Código: %). Disponible: %, Solicitado: %',
        v_producto.nombre, v_producto.codigo, v_producto.stock_actual, v_cantidad;
    end if;

    -- Validación estricta de precio y descuento oficial
    v_precio_oficial := coalesce(v_producto.precio, 0);
    v_descuento_pct := coalesce(v_item.descuento_solicitado, 0);

    if v_descuento_pct < 0 or v_descuento_pct > 100 then
      raise exception 'Porcentaje de descuento inválido.';
    end if;

    -- Regla de autorización de descuento: Cajero máximo 3%, Administrador ilimitado
    if v_descuento_pct > 0 then
      if p_rol_usuario not in ('ADMINISTRADOR', 'admin') and v_descuento_pct > 3.0 then
        raise exception 'Descuento del % por ciento excede el límite autorizado para su rol (máximo 3 por ciento). Requiere autorización de Administrador.', v_descuento_pct;
      end if;
      v_precio_final := round(v_precio_oficial * (1.0 - (v_descuento_pct / 100.0)), 2);
    else
      v_precio_final := v_precio_oficial;
    end if;

    v_subtotal_linea := round(v_cantidad * v_precio_final, 2);
    v_subtotal_gravable := v_subtotal_gravable + round(v_cantidad * v_precio_oficial, 2);
    v_descuento_total := v_descuento_total + (round(v_cantidad * v_precio_oficial, 2) - v_subtotal_linea);

    -- Insertar línea de factura
    insert into public.factura_items (
      factura_id, producto_id, cantidad, precio, unidad_medida, observacion
    ) values (
      v_factura_id, v_producto.id, v_cantidad, v_precio_final, v_producto.unidad_medida, coalesce(v_item.observacion, '')
    );

    -- Actualizar stock del producto
    update public.productos
    set stock_actual = stock_actual - v_cantidad,
        total_salidas = total_salidas + v_cantidad,
        actualizado_en = now()
    where id = v_producto.id;

    -- Registrar salida en kárdex con llave idempotente
    v_llave_kardex := 'FACTURA:' || v_factura_id::text || ':ITEM:' || v_producto.id::text;
    insert into public.kardex_movimientos (
      producto_id, fecha, tipo_movimiento, cantidad, unidad_medida, destinatario,
      numero_referencia, concepto, usuario_nombre, origen, idempotency_key
    ) values (
      v_producto.id, p_fecha, 'SALIDA'::public.tipo_movimiento, v_cantidad, v_producto.unidad_medida, trim(p_cliente_nombre),
      v_numero_factura, 'Factura ' || v_numero_factura || coalesce(' · ' || v_item.observacion, ''),
      p_creado_por, 'FACTURA'::public.origen_movimiento, v_llave_kardex
    );
  end loop;

  -- 7. Cálculos financieros deterministas en el servidor
  v_impuesto_total := round((v_subtotal_gravable - v_descuento_total) * (p_tasa_iva / 100.0), 2);
  v_total_factura := round((v_subtotal_gravable - v_descuento_total) + v_impuesto_total, 2);

  -- 8. Validar límite de crédito del cliente si la venta es a CRÉDITO
  if p_forma_pago = 'CREDITO' then
    if (v_cliente.saldo_deudor + v_total_factura) > v_cliente.limite_credito then
      raise exception 'Límite de crédito excedido. Saldo actual: C$ %, Límite: C$ %, Total Venta: C$ %',
        v_cliente.saldo_deudor, v_cliente.limite_credito, v_total_factura;
    end if;

    update public.clientes
    set saldo_deudor = saldo_deudor + v_total_factura
    where id = p_cliente_id;
  end if;

  -- 9. Actualizar cabecera con totales auditados
  update public.facturas
  set subtotal = v_subtotal_gravable,
      descuento = v_descuento_total,
      impuesto = v_impuesto_total,
      total = v_total_factura,
      stock_aplicado = true
  where id = v_factura_id;

  -- 10. Si vino de una cotización, marcar como FACTURADA
  if p_cotizacion_id is not null then
    update public.cotizaciones
    set estado = 'FACTURADA',
        factura_id = v_factura_id
    where id = p_cotizacion_id;
  end if;

  -- 11. Si hay turno de caja abierto, acumular flujos
  select * into v_turno
  from public.turnos_caja
  where estado = 'ABIERTO'
  order by created_at desc
  limit 1
  for update;

  if found then
    if p_forma_pago = 'EFECTIVO' then
      update public.turnos_caja
      set total_ventas_efectivo = total_ventas_efectivo + v_total_factura
      where id = v_turno.id;
    elsif p_forma_pago in ('TARJETA', 'TRANSFERENCIA') then
      update public.turnos_caja
      set total_ventas_tarjeta = total_ventas_tarjeta + v_total_factura
      where id = v_turno.id;
    elsif p_forma_pago = 'CREDITO' then
      update public.turnos_caja
      set total_ventas_credito = total_ventas_credito + v_total_factura
      where id = v_turno.id;
    end if;
  end if;

  -- 12. Retornar resultado estructurado
  return jsonb_build_object(
    'status', 'OK',
    'idempotente', false,
    'factura_id', v_factura_id,
    'numero', v_numero_factura,
    'subtotal', v_subtotal_gravable,
    'descuento', v_descuento_total,
    'impuesto', v_impuesto_total,
    'total', v_total_factura
  );
end;
$$ language plpgsql security definer;


-- -----------------------------------------------------------------------------
-- 2. Función RPC: registrar_compra_transaccional
--
-- Reglas de Negocio Implementadas:
-- - Idempotencia mediante p_idempotency_key.
-- - Recalcula el Costo Promedio Ponderado (CPP) por producto de manera atómica:
--     CPP_Nuevo = ((Stock_Actual * Costo_Actual) + (Cantidad_Comprada * Costo_Unitario)) / (Stock_Actual + Cantidad_Comprada)
-- - Aumenta el stock_actual y total_entradas.
-- - Registra el movimiento de ENTRADA en kárdex.
-- - Registra la cabecera y el detalle de compra.
-- -----------------------------------------------------------------------------

create or replace function public.registrar_compra_transaccional(
  p_idempotency_key text,
  p_proveedor_id uuid,
  p_proveedor_nombre text,
  p_fecha date,
  p_notas text,
  p_creado_por text,
  p_items jsonb -- Array de { producto_id: uuid, cantidad: numeric, costo_unitario: numeric, observacion?: text }
) returns jsonb as $$
declare
  v_compra_existente record;
  v_compra_id uuid;
  v_numero_compra text;
  v_item record;
  v_producto record;
  v_cantidad numeric(14, 3);
  v_costo_unitario numeric(14, 2);
  v_costo_actual numeric(14, 2);
  v_stock_actual numeric(14, 3);
  v_nuevo_stock numeric(14, 3);
  v_nuevo_cpp numeric(14, 2);
  v_total_compra numeric(14, 2) := 0;
  v_llave_kardex text;
begin
  -- 1. Idempotencia
  select id, numero, total into v_compra_existente
  from public.compras
  where idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'status', 'OK',
      'idempotente', true,
      'compra_id', v_compra_existente.id,
      'numero', v_compra_existente.numero,
      'mensaje', 'Compra previamente registrada.'
    );
  end if;

  -- 2. Validaciones
  if p_proveedor_nombre is null or length(trim(p_proveedor_nombre)) < 2 then
    raise exception 'Debe indicar un nombre válido para el proveedor.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Debe incluir al menos un artículo en la compra.';
  end if;

  v_numero_compra := public.siguiente_numero('CMP', 'secuencia_compra');
  v_compra_id := gen_random_uuid();

  -- 3. Crear cabecera preliminar
  insert into public.compras (
    id, numero, proveedor_id, proveedor, fecha, notas,
    creado_por, anulada, total, idempotency_key
  ) values (
    v_compra_id, v_numero_compra, p_proveedor_id, trim(p_proveedor_nombre), p_fecha,
    coalesce(p_notas, ''), p_creado_por, false, 0, p_idempotency_key
  );

  -- 4. Procesar líneas con cálculo de Costo Promedio Ponderado (CPP)
  for v_item in select * from jsonb_to_recordset(p_items) as x(
    producto_id uuid,
    cantidad numeric,
    costo_unitario numeric,
    observacion text
  )
  loop
    v_cantidad := coalesce(v_item.cantidad, 0);
    v_costo_unitario := coalesce(v_item.costo_unitario, 0);

    if v_cantidad <= 0 then
      raise exception 'La cantidad comprada debe ser mayor que cero.';
    end if;

    if v_costo_unitario < 0 then
      raise exception 'El costo unitario no puede ser negativo.';
    end if;

    -- Bloqueo pesimista del producto
    select * into v_producto
    from public.productos
    where id = v_item.producto_id and activo = true
    for update;

    if not found then
      raise exception 'Artículo no encontrado para compra: %', v_item.producto_id;
    end if;

    v_stock_actual := coalesce(v_producto.stock_actual, 0);
    v_costo_actual := coalesce(v_producto.costo, 0);
    v_nuevo_stock := v_stock_actual + v_cantidad;

    -- Ecuación CPP: ((Stock * Costo) + (CantidadComprada * CostoUnitario)) / (Stock + CantidadComprada)
    if v_nuevo_stock > 0 then
      v_nuevo_cpp := round(((v_stock_actual * v_costo_actual) + (v_cantidad * v_costo_unitario)) / v_nuevo_stock, 2);
    else
      v_nuevo_cpp := v_costo_unitario;
    end if;

    v_total_compra := v_total_compra + round(v_cantidad * v_costo_unitario, 2);

    -- Insertar línea de compra
    insert into public.compra_items (
      compra_id, producto_id, cantidad, costo_unitario, observacion
    ) values (
      v_compra_id, v_producto.id, v_cantidad, v_costo_unitario, coalesce(v_item.observacion, '')
    );

    -- Actualizar existencia y CPP del producto
    update public.productos
    set stock_actual = v_nuevo_stock,
        total_entradas = total_entradas + v_cantidad,
        costo = v_nuevo_cpp,
        actualizado_en = now()
    where id = v_producto.id;

    -- Registrar entrada en kárdex
    v_llave_kardex := 'COMPRA:' || v_compra_id::text || ':ITEM:' || v_producto.id::text;
    insert into public.kardex_movimientos (
      producto_id, fecha, tipo_movimiento, cantidad, unidad_medida, destinatario,
      numero_referencia, concepto, usuario_nombre, origen, idempotency_key
    ) values (
      v_producto.id, p_fecha, 'ENTRADA'::public.tipo_movimiento, v_cantidad, v_producto.unidad_medida, trim(p_proveedor_nombre),
      v_numero_compra, 'Compra ' || v_numero_compra || coalesce(' · ' || v_item.observacion, ''),
      p_creado_por, 'COMPRA'::public.origen_movimiento, v_llave_kardex
    );
  end loop;

  -- 5. Actualizar total de la compra
  update public.compras
  set total = v_total_compra
  where id = v_compra_id;

  return jsonb_build_object(
    'status', 'OK',
    'idempotente', false,
    'compra_id', v_compra_id,
    'numero', v_numero_compra,
    'total', v_total_compra
  );
end;
$$ language plpgsql security definer;
