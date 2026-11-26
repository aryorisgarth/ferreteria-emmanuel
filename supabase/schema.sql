-- Ferretería Emmanuel — libro de bodega
-- Ejecutar en el editor SQL de Supabase (PostgreSQL 15+).
--
-- Ecuación, siempre por artículo y por su propia unidad de medida:
--   stock actual = inventario inicial + sum(entradas) − sum(salidas)
-- Metros no se suman con bolsas. El total del día suma el mismo artículo
-- aunque el despacho haya salido hacia oficinas distintas.
--
-- Máquina de estados de la solicitud:
--   PENDIENTE_DE_REVISION  no toca el stock ni el kárdex
--   APROBADO               emite el acta y tampoco descuenta
--   ENTREGADO              descuenta una sola vez y escribe el kárdex
--
-- La idempotencia vive en tres capas:
--   1. solicitudes.stock_aplicado, con bloqueo FOR UPDATE
--   2. kardex_movimientos.idempotency_key único
--   3. trigger BEFORE INSERT que aborta un descargo repetido

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

do $$ begin
  create type unidad_medida as enum (
    'UNIDAD', 'METRO', 'METRO_CUBICO', 'KILOGRAMO', 'LIBRA',
    'BOLSA', 'CAJA', 'GALON', 'LITRO', 'ROLLO', 'PAR', 'JUEGO'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_solicitud as enum (
    'PENDIENTE_DE_REVISION', 'APROBADO', 'ENTREGADO'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento as enum ('ENTRADA', 'SALIDA', 'AJUSTE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type origen_movimiento as enum (
    'MANUAL', 'SOLICITUD', 'SALIDA_DIRECTA', 'EXCEL'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_auditoria as enum ('NORMAL', 'EN_AUDITORIA', 'OBSERVADO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rol_usuario as enum ('admin', 'bodega', 'auditor', 'solicitante');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Catálogos y Usuarios del Sistema
-- ---------------------------------------------------------------------------

create table if not exists usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  usuario text not null unique,
  nombre text not null,
  password_hash text not null,
  rol text not null default 'CAJERO' check (rol in ('ADMINISTRADOR', 'CAJERO', 'BODEGUERO', 'VENDEDOR')),
  activo boolean not null default true,
  intentos_fallidos int not null default 0,
  bloqueado_hasta timestamptz,
  ultimo_acceso timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_usuarios_sistema_usuario on usuarios_sistema(usuario);

create table if not exists perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol rol_usuario not null default 'bodega'
);

create table if not exists oficinas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  tipo text not null default 'OFICINA' check (tipo in ('OFICINA', 'DEPENDENCIA', 'PERSONA')),
  activo boolean not null default true
);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  unidad_medida unidad_medida not null,
  inventario_inicial numeric(14, 3) not null default 0 check (inventario_inicial >= 0),
  stock_actual numeric(14, 3) not null default 0 check (stock_actual >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists solicitudes (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  estado estado_solicitud not null default 'PENDIENTE_DE_REVISION',
  solicitante text not null,
  oficina_id uuid not null references oficinas (id),
  destinatario text not null,
  observaciones text not null default '',
  fecha date not null,
  acta_id uuid,
  stock_aplicado boolean not null default false,
  creado_por text not null,
  created_at timestamptz not null default now()
);

create table if not exists solicitud_items (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes (id) on delete cascade,
  producto_id uuid not null references productos (id),
  cantidad numeric(14, 3) not null check (cantidad > 0),
  unidad_medida unidad_medida not null,
  observacion text not null default ''
);

create table if not exists actas_entrega (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  solicitud_id uuid unique references solicitudes (id),
  es_salida_directa boolean not null default false,
  oficina_id uuid not null references oficinas (id),
  destinatario text not null check (length(btrim(destinatario)) > 0),
  fecha date not null,
  concepto text not null,
  ejecutada boolean not null default false,
  created_at timestamptz not null default now()
);

alter table solicitudes
  drop constraint if exists solicitudes_acta_id_fkey;
alter table solicitudes
  add constraint solicitudes_acta_id_fkey
  foreign key (acta_id) references actas_entrega (id);

create table if not exists acta_items (
  id uuid primary key default gen_random_uuid(),
  acta_id uuid not null references actas_entrega (id) on delete cascade,
  producto_id uuid not null references productos (id),
  solicitud_item_id uuid references solicitud_items (id),
  cantidad numeric(14, 3) not null check (cantidad > 0),
  unidad_medida unidad_medida not null,
  observacion text not null default ''
);

create table if not exists kardex_movimientos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos (id),
  fecha date not null,
  tipo_movimiento tipo_movimiento not null,
  cantidad numeric(14, 3) not null,
  entradas numeric(14, 3) not null default 0 check (entradas >= 0),
  salidas numeric(14, 3) not null default 0 check (salidas >= 0),
  stock_saldo numeric(14, 3) not null default 0,
  unidad_medida unidad_medida not null,
  destinatario text not null default '',
  oficina_id uuid references oficinas (id),
  acta_id uuid references actas_entrega (id),
  acta_item_id uuid references acta_items (id),
  solicitud_id uuid references solicitudes (id),
  solicitud_item_id uuid references solicitud_items (id),
  numero_referencia text not null default '',
  concepto text not null,
  usuario_nombre text not null,
  es_auditoria boolean not null default false,
  estado_auditoria estado_auditoria not null default 'NORMAL',
  origen origen_movimiento not null,
  idempotency_key text,
  secuencia integer not null default 0,
  created_at timestamptz not null default now(),
  constraint salida_con_destino check (
    tipo_movimiento <> 'SALIDA' or length(btrim(destinatario)) > 0
  ),
  constraint cantidad_positiva check (
    tipo_movimiento = 'AJUSTE' or cantidad > 0
  )
);

create unique index if not exists uq_kardex_idempotency
  on kardex_movimientos (idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_kardex_producto
  on kardex_movimientos (producto_id, fecha, secuencia, created_at);

create index if not exists idx_kardex_fecha
  on kardex_movimientos (fecha);

create index if not exists idx_solicitudes_estado
  on solicitudes (estado);

create sequence if not exists seq_solicitud as integer start with 1;
create sequence if not exists seq_acta as integer start with 1;
create sequence if not exists seq_excel as integer start with 1;
create sequence if not exists secuencia_factura as integer start with 1;
create sequence if not exists secuencia_compra as integer start with 1;
create sequence if not exists secuencia_cotizacion as integer start with 1;

-- ---------------------------------------------------------------------------
-- Autorización
-- ---------------------------------------------------------------------------

create or replace function public.es_bodega()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.role(), '') in ('service_role', 'supabase_admin')
    or current_user in ('postgres', 'supabase_admin')
    or exists (
      select 1
      from public.perfiles
      where id = auth.uid()
        and rol in ('admin', 'bodega')
    );
$$;

create or replace function public.exigir_bodega()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_bodega() then
    raise exception 'No autorizado para operar la bodega';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Recalcular stock y reescribir la secuencia del kárdex
-- ---------------------------------------------------------------------------

create or replace function public.recalcular_stock_producto(p_producto_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inicial numeric(14, 3);
  v_saldo numeric(14, 3);
  v_entradas numeric(14, 3);
  v_salidas numeric(14, 3);
  v_unidad unidad_medida;
  v_nombre text;
  v_codigo text;
  v_ya boolean;
  v_orden integer := 0;
  r record;
begin
  v_ya := coalesce(current_setting('app.recalc_en_curso', true), '') = '1';
  perform set_config('app.recalc_en_curso', '1', true);

  select inventario_inicial, unidad_medida, nombre, codigo
    into v_inicial, v_unidad, v_nombre, v_codigo
  from productos
  where id = p_producto_id
  for update;

  if not found then
    raise exception 'Artículo inexistente';
  end if;

  v_saldo := v_inicial;

  for r in
    select id, tipo_movimiento, cantidad
    from kardex_movimientos
    where producto_id = p_producto_id
    order by fecha asc, secuencia asc, created_at asc, id asc
  loop
    v_orden := v_orden + 1;

    if r.tipo_movimiento = 'ENTRADA' then
      v_entradas := r.cantidad;
      v_salidas := 0;
      v_saldo := v_saldo + r.cantidad;
    elsif r.tipo_movimiento = 'SALIDA' then
      v_entradas := 0;
      v_salidas := r.cantidad;
      v_saldo := v_saldo - r.cantidad;
    else
      if r.cantidad >= 0 then
        v_entradas := r.cantidad;
        v_salidas := 0;
      else
        v_entradas := 0;
        v_salidas := abs(r.cantidad);
      end if;
      v_saldo := v_saldo + r.cantidad;
    end if;

    if v_saldo < 0 then
      raise exception
        'Stock insuficiente de % (%). El saldo de la secuencia quedaría en % %s.',
        v_nombre, v_codigo, v_saldo, v_unidad;
    end if;

    update kardex_movimientos
      set entradas = v_entradas,
          salidas = v_salidas,
          stock_saldo = v_saldo,
          unidad_medida = v_unidad,
          secuencia = v_orden
    where id = r.id;
  end loop;

  update productos
    set stock_actual = v_saldo,
        updated_at = now()
  where id = p_producto_id;

  if not v_ya then
    perform set_config('app.recalc_en_curso', '0', true);
  end if;

  return v_saldo;
exception when others then
  if not v_ya then
    perform set_config('app.recalc_en_curso', '0', true);
  end if;
  raise;
end;
$$;

comment on function public.recalcular_stock_producto is
  'Reescribe entradas, salidas, stock_saldo y secuencia. Stock = inventario_inicial + entradas − salidas, solo de ese artículo.';

-- ---------------------------------------------------------------------------
-- Triggers del kárdex
-- ---------------------------------------------------------------------------

create or replace function public.trg_kardex_normalizar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unidad unidad_medida;
begin
  select unidad_medida into v_unidad
  from productos
  where id = new.producto_id;

  if v_unidad is null then
    raise exception 'Artículo inexistente';
  end if;

  new.unidad_medida := v_unidad;

  if length(btrim(coalesce(new.concepto, ''))) = 0 then
    raise exception 'El concepto del movimiento es obligatorio.';
  end if;

  if new.tipo_movimiento in ('ENTRADA', 'SALIDA') and new.cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero.';
  end if;

  if new.tipo_movimiento = 'SALIDA' and length(btrim(coalesce(new.destinatario, ''))) = 0 then
    raise exception 'Toda salida exige destinatario, persona u oficina.';
  end if;

  if new.idempotency_key is not null and exists (
    select 1
    from kardex_movimientos
    where idempotency_key = new.idempotency_key
      and id <> new.id
  ) then
    raise exception
      'DESCARGO_DUPLICADO: el movimiento % ya fue aplicado. No se descuenta el stock otra vez.',
      new.idempotency_key;
  end if;

  if new.es_auditoria and new.estado_auditoria = 'NORMAL' then
    new.estado_auditoria := 'EN_AUDITORIA';
  end if;

  if not new.es_auditoria then
    new.estado_auditoria := 'NORMAL';
  end if;

  if tg_op = 'INSERT' then
    new.secuencia := coalesce(
      (select max(secuencia) + 1 from kardex_movimientos where producto_id = new.producto_id),
      1
    );
  end if;

  return new;
end;
$$;

create or replace function public.trg_kardex_recalcular()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('app.recalc_en_curso', true), '') = '1' then
    return null;
  end if;

  if tg_op = 'DELETE' then
    perform public.recalcular_stock_producto(old.producto_id);
    return null;
  end if;

  if tg_op = 'UPDATE' and old.producto_id is distinct from new.producto_id then
    perform public.recalcular_stock_producto(old.producto_id);
  end if;

  perform public.recalcular_stock_producto(new.producto_id);
  return null;
end;
$$;

drop trigger if exists kardex_normalizar on kardex_movimientos;
create trigger kardex_normalizar
  before insert or update on kardex_movimientos
  for each row execute function public.trg_kardex_normalizar();

drop trigger if exists kardex_recalcular on kardex_movimientos;
create trigger kardex_recalcular
  after insert or update or delete on kardex_movimientos
  for each row execute function public.trg_kardex_recalcular();

create or replace function public.trg_producto_unidad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.unidad_medida is distinct from new.unidad_medida then
    if exists (select 1 from kardex_movimientos where producto_id = new.id)
      or exists (select 1 from solicitud_items where producto_id = new.id) then
      raise exception 'No se cambia la unidad de medida de un artículo que ya tiene movimientos.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists producto_unidad on productos;
create trigger producto_unidad
  before update on productos
  for each row execute function public.trg_producto_unidad();

-- El recálculo corre después de guardar el inventario inicial nuevo.
create or replace function public.trg_producto_recalcular_inicial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.inventario_inicial is distinct from new.inventario_inicial
     and coalesce(current_setting('app.recalc_en_curso', true), '') <> '1' then
    perform public.recalcular_stock_producto(new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists producto_recalcular_inicial on productos;
create trigger producto_recalcular_inicial
  after update of inventario_inicial on productos
  for each row execute function public.trg_producto_recalcular_inicial();

create or replace function public.trg_solicitud_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.stock_aplicado and not new.stock_aplicado then
    raise exception 'El descargo ya aplicado no se revierte por esta vía. Corrija el renglón del kárdex.';
  end if;

  if old.estado = 'ENTREGADO' and new.estado is distinct from old.estado then
    raise exception 'Una solicitud ENTREGADA no cambia de estado.';
  end if;

  if new.estado is distinct from old.estado and new.estado = 'APROBADO' then
    if old.estado <> 'PENDIENTE_DE_REVISION' then
      raise exception 'Solo una solicitud pendiente de revisión puede aprobarse.';
    end if;
    if new.acta_id is null then
      raise exception 'No se puede aprobar sin acta de entrega.';
    end if;
  end if;

  if new.estado is distinct from old.estado and new.estado = 'ENTREGADO' then
    if old.estado <> 'APROBADO' then
      raise exception 'Solo una solicitud APROBADA puede entregarse.';
    end if;
    if not new.stock_aplicado then
      raise exception 'No se marca ENTREGADO sin el descargo en el kárdex.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists solicitud_estado on solicitudes;
create trigger solicitud_estado
  before update on solicitudes
  for each row execute function public.trg_solicitud_estado();

create or replace function public.trg_item_unidad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unidad unidad_medida;
  v_estado estado_solicitud;
begin
  select unidad_medida into v_unidad from productos where id = new.producto_id;
  if v_unidad is null then
    raise exception 'Artículo inexistente';
  end if;
  new.unidad_medida := v_unidad;

  select estado into v_estado from solicitudes where id = new.solicitud_id;
  if v_estado is distinct from 'PENDIENTE_DE_REVISION'
     and coalesce(current_setting('app.correccion_acta', true), '') <> '1' then
    raise exception 'Los renglones de la solicitud quedan fijos al aprobarse. La corrección posterior se hace en el kárdex.';
  end if;

  return new;
end;
$$;

drop trigger if exists solicitud_item_unidad on solicitud_items;
create trigger solicitud_item_unidad
  before insert or update on solicitud_items
  for each row execute function public.trg_item_unidad();

create or replace function public.trg_acta_item_unidad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unidad unidad_medida;
begin
  select unidad_medida into v_unidad from productos where id = new.producto_id;
  if v_unidad is null then
    raise exception 'Artículo inexistente';
  end if;
  new.unidad_medida := v_unidad;
  return new;
end;
$$;

drop trigger if exists acta_item_unidad on acta_items;
create trigger acta_item_unidad
  before insert or update on acta_items
  for each row execute function public.trg_acta_item_unidad();

-- ---------------------------------------------------------------------------
-- Operaciones
-- ---------------------------------------------------------------------------

create or replace function public.siguiente_numero(p_prefijo text, p_seq regclass)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return p_prefijo || '-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval(p_seq)::text, 5, '0');
end;
$$;

create or replace function public.alta_producto(
  p_codigo text,
  p_nombre text,
  p_unidad unidad_medida,
  p_inicial numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform public.exigir_bodega();
  if p_inicial < 0 then
    raise exception 'El inventario inicial no puede ser negativo.';
  end if;
  if length(btrim(p_codigo)) = 0 or length(btrim(p_nombre)) = 0 then
    raise exception 'Código y descripción son obligatorios.';
  end if;

  insert into productos (codigo, nombre, unidad_medida, inventario_inicial, stock_actual)
  values (upper(btrim(p_codigo)), btrim(p_nombre), p_unidad, p_inicial, p_inicial)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.crear_solicitud(
  p_solicitante text,
  p_oficina_id uuid,
  p_destinatario text,
  p_observaciones text,
  p_fecha date,
  p_usuario text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
  v_numero text;
  v_destino text;
  v_item jsonb;
  v_producto uuid;
  v_cantidad numeric;
begin
  perform public.exigir_bodega();

  if length(btrim(coalesce(p_solicitante, ''))) = 0 then
    raise exception 'Indique el solicitante.';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La solicitud no tiene artículos.';
  end if;
  if not exists (select 1 from oficinas where id = p_oficina_id) then
    raise exception 'La dependencia de destino no existe.';
  end if;

  select coalesce(nullif(btrim(p_destinatario), ''), nombre)
    into v_destino
  from oficinas
  where id = p_oficina_id;

  v_numero := public.siguiente_numero('SM', 'seq_solicitud');

  insert into solicitudes (
    id, numero, estado, solicitante, oficina_id, destinatario,
    observaciones, fecha, stock_aplicado, creado_por
  ) values (
    v_id, v_numero, 'PENDIENTE_DE_REVISION', btrim(p_solicitante), p_oficina_id,
    v_destino, coalesce(p_observaciones, ''), p_fecha, false, p_usuario
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_producto := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::numeric;
    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cada renglón debe tener una cantidad mayor que cero.';
    end if;

    insert into solicitud_items (solicitud_id, producto_id, cantidad, unidad_medida, observacion)
    select v_id, v_producto, v_cantidad, unidad_medida, coalesce(v_item->>'observacion', '')
    from productos
    where id = v_producto;

    if not found then
      raise exception 'Hay un artículo que no existe en el libro.';
    end if;
  end loop;

  return v_id;
end;
$$;

create or replace function public.aprobar_solicitud(p_id uuid, p_usuario text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sol solicitudes%rowtype;
  v_acta uuid := gen_random_uuid();
  v_numero text;
begin
  perform public.exigir_bodega();

  select * into v_sol from solicitudes where id = p_id for update;
  if not found then
    raise exception 'La solicitud no existe.';
  end if;
  if v_sol.estado <> 'PENDIENTE_DE_REVISION' or v_sol.stock_aplicado then
    raise exception 'Solo una solicitud pendiente de revisión puede aprobarse.';
  end if;

  v_numero := public.siguiente_numero('AE', 'seq_acta');

  insert into actas_entrega (
    id, numero, solicitud_id, es_salida_directa, oficina_id,
    destinatario, fecha, concepto, ejecutada
  ) values (
    v_acta, v_numero, v_sol.id, false, v_sol.oficina_id, v_sol.destinatario,
    v_sol.fecha,
    coalesce(nullif(v_sol.observaciones, ''), 'Entrega según solicitud ' || v_sol.numero),
    false
  );

  insert into acta_items (acta_id, producto_id, solicitud_item_id, cantidad, unidad_medida, observacion)
  select v_acta, producto_id, id, cantidad, unidad_medida, observacion
  from solicitud_items
  where solicitud_id = v_sol.id;

  update solicitudes
    set estado = 'APROBADO',
        acta_id = v_acta
  where id = v_sol.id;

  return v_acta;
end;
$$;

create or replace function public.entregar_solicitud(p_id uuid, p_usuario text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sol solicitudes%rowtype;
  v_acta actas_entrega%rowtype;
  v_item record;
  v_stock numeric(14, 3);
  v_necesario numeric(14, 3);
begin
  perform public.exigir_bodega();

  select * into v_sol from solicitudes where id = p_id for update;
  if not found then
    raise exception 'La solicitud no existe.';
  end if;

  if v_sol.estado = 'ENTREGADO' or v_sol.stock_aplicado then
    raise exception
      'DESCARGO_DUPLICADO: la solicitud ya está ENTREGADA y su salida consta en el kárdex. No se descuenta el stock otra vez.';
  end if;

  if v_sol.estado <> 'APROBADO' or v_sol.acta_id is null then
    raise exception 'La solicitud debe estar APROBADA y tener acta antes de entregarse.';
  end if;

  select * into v_acta from actas_entrega where id = v_sol.acta_id for update;
  if v_acta.ejecutada then
    raise exception
      'DESCARGO_DUPLICADO: el acta % ya fue ejecutada. No se descuenta el stock otra vez.',
      v_acta.numero;
  end if;

  -- Cierra el stock de cada artículo antes de insertar, sumando renglones
  -- del mismo producto y sin mezclar unidades (cada producto tiene una sola).
  for v_item in
    select producto_id, sum(cantidad) as cantidad
    from solicitud_items
    where solicitud_id = v_sol.id
    group by producto_id
  loop
    select stock_actual into v_stock
    from productos
    where id = v_item.producto_id
    for update;

    if v_stock < v_item.cantidad then
      raise exception 'Stock insuficiente para entregar la solicitud %.', v_sol.numero;
    end if;
  end loop;

  for v_item in
    select si.*, ai.id as acta_item_id
    from solicitud_items si
    left join acta_items ai
      on ai.acta_id = v_acta.id
     and ai.solicitud_item_id = si.id
    where si.solicitud_id = v_sol.id
  loop
    insert into kardex_movimientos (
      producto_id, fecha, tipo_movimiento, cantidad, unidad_medida,
      destinatario, oficina_id, acta_id, acta_item_id, solicitud_id,
      solicitud_item_id, numero_referencia, concepto, usuario_nombre,
      es_auditoria, origen, idempotency_key
    ) values (
      v_item.producto_id, v_sol.fecha, 'SALIDA', v_item.cantidad, v_item.unidad_medida,
      v_sol.destinatario, v_sol.oficina_id, v_acta.id, v_item.acta_item_id,
      v_sol.id, v_item.id, v_acta.numero,
      'Entrega ' || v_acta.numero || ' · ' || v_sol.numero,
      p_usuario, false, 'SOLICITUD',
      'SOLICITUD:' || v_sol.id::text || ':ITEM:' || v_item.id::text
    );
  end loop;

  update actas_entrega set ejecutada = true where id = v_acta.id;
  update solicitudes
    set estado = 'ENTREGADO',
        stock_aplicado = true
  where id = v_sol.id;
end;
$$;

create or replace function public.registrar_entrada(
  p_producto_id uuid,
  p_cantidad numeric,
  p_fecha date,
  p_concepto text,
  p_usuario text,
  p_es_auditoria boolean,
  p_origen origen_movimiento default 'MANUAL'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  perform public.exigir_bodega();
  if p_cantidad <= 0 then
    raise exception 'La entrada debe ser mayor que cero.';
  end if;

  insert into kardex_movimientos (
    id, producto_id, fecha, tipo_movimiento, cantidad, unidad_medida,
    destinatario, concepto, usuario_nombre, es_auditoria, origen, numero_referencia
  )
  select
    v_id, id, p_fecha, 'ENTRADA', p_cantidad, unidad_medida,
    '', btrim(p_concepto), p_usuario, coalesce(p_es_auditoria, false), p_origen, 'ENT-' || to_char(p_fecha, 'YYYYMMDD')
  from productos
  where id = p_producto_id;

  if not found then
    raise exception 'Artículo inexistente';
  end if;

  return v_id;
end;
$$;

create or replace function public.salida_directa(
  p_oficina_id uuid,
  p_destinatario text,
  p_fecha date,
  p_concepto text,
  p_usuario text,
  p_es_auditoria boolean,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acta uuid := gen_random_uuid();
  v_numero text;
  v_destino text;
  v_item jsonb;
  v_linea uuid;
  v_producto uuid;
  v_cantidad numeric;
  v_stock numeric;
begin
  perform public.exigir_bodega();

  if length(btrim(coalesce(p_destinatario, ''))) = 0 then
    raise exception 'Toda salida exige destinatario, persona u oficina.';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La salida directa no tiene artículos.';
  end if;
  if not exists (select 1 from oficinas where id = p_oficina_id) then
    raise exception 'La dependencia de destino no existe.';
  end if;

  v_destino := btrim(p_destinatario);

  for v_item in
    select producto_id, sum(cantidad) as cantidad
    from (
      select (value->>'producto_id')::uuid as producto_id,
             (value->>'cantidad')::numeric as cantidad
      from jsonb_array_elements(p_items)
    ) lineas
    group by producto_id
  loop
    select stock_actual into v_stock from productos where id = v_item.producto_id for update;
    if v_stock is null then
      raise exception 'Hay un artículo que no existe en el libro.';
    end if;
    if v_stock < v_item.cantidad then
      raise exception 'Stock insuficiente para la salida directa.';
    end if;
  end loop;

  v_numero := public.siguiente_numero('AE', 'seq_acta');

  insert into actas_entrega (
    id, numero, solicitud_id, es_salida_directa, oficina_id,
    destinatario, fecha, concepto, ejecutada
  ) values (
    v_acta, v_numero, null, true, p_oficina_id, v_destino, p_fecha,
    btrim(p_concepto), false
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_producto := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::numeric;
    v_linea := gen_random_uuid();

    insert into acta_items (id, acta_id, producto_id, cantidad, unidad_medida, observacion)
    select v_linea, v_acta, id, v_cantidad, unidad_medida, coalesce(v_item->>'observacion', '')
    from productos
    where id = v_producto;

    insert into kardex_movimientos (
      producto_id, fecha, tipo_movimiento, cantidad, unidad_medida,
      destinatario, oficina_id, acta_id, acta_item_id, numero_referencia,
      concepto, usuario_nombre, es_auditoria, origen, idempotency_key
    )
    select
      id, p_fecha, 'SALIDA', v_cantidad, unidad_medida,
      v_destino, p_oficina_id, v_acta, v_linea, v_numero,
      btrim(p_concepto), p_usuario, coalesce(p_es_auditoria, false), 'SALIDA_DIRECTA',
      'ACTA:' || v_acta::text || ':ITEM:' || v_linea::text
    from productos
    where id = v_producto;
  end loop;

  update actas_entrega set ejecutada = true where id = v_acta;
  return v_acta;
end;
$$;

create or replace function public.editar_movimiento(
  p_id uuid,
  p_cantidad numeric,
  p_fecha date,
  p_concepto text,
  p_destinatario text,
  p_oficina_id uuid,
  p_es_auditoria boolean,
  p_estado_auditoria estado_auditoria,
  p_usuario text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mov kardex_movimientos%rowtype;
begin
  perform public.exigir_bodega();

  select * into v_mov from kardex_movimientos where id = p_id for update;
  if not found then
    raise exception 'El renglón del kárdex no existe.';
  end if;

  if v_mov.tipo_movimiento = 'SALIDA' and length(btrim(coalesce(p_destinatario, ''))) = 0 then
    raise exception 'Toda salida exige destinatario, persona u oficina.';
  end if;
  if length(btrim(coalesce(p_concepto, ''))) = 0 then
    raise exception 'El concepto del movimiento es obligatorio.';
  end if;

  update kardex_movimientos
    set cantidad = p_cantidad,
        fecha = p_fecha,
        concepto = btrim(p_concepto),
        destinatario = case
          when v_mov.tipo_movimiento = 'SALIDA' then btrim(p_destinatario)
          else destinatario
        end,
        oficina_id = case
          when v_mov.tipo_movimiento = 'SALIDA' then p_oficina_id
          else oficina_id
        end,
        es_auditoria = p_es_auditoria,
        estado_auditoria = p_estado_auditoria,
        usuario_nombre = p_usuario
  where id = p_id;

  if v_mov.acta_id is not null and v_mov.tipo_movimiento = 'SALIDA' then
    update actas_entrega
      set destinatario = btrim(p_destinatario),
          oficina_id = coalesce(p_oficina_id, oficina_id)
    where id = v_mov.acta_id;

    update kardex_movimientos
      set destinatario = btrim(p_destinatario),
          oficina_id = p_oficina_id
    where acta_id = v_mov.acta_id
      and id <> p_id;

    update solicitudes
      set destinatario = btrim(p_destinatario),
          oficina_id = coalesce(p_oficina_id, oficina_id)
    where acta_id = v_mov.acta_id;
  end if;

  perform set_config('app.correccion_acta', '1', true);

  if v_mov.acta_item_id is not null then
    update acta_items set cantidad = p_cantidad where id = v_mov.acta_item_id;
  end if;

  if v_mov.solicitud_item_id is not null then
    update solicitud_items set cantidad = p_cantidad where id = v_mov.solicitud_item_id;
  end if;
end;
$$;

create or replace function public.importar_excel(p_filas jsonb, p_usuario text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fila jsonb;
  v_n integer := 0;
  v_producto productos%rowtype;
  v_tipo tipo_movimiento;
  v_cantidad numeric;
  v_destino text;
  v_oficina uuid;
  v_ref text;
begin
  perform public.exigir_bodega();
  if p_filas is null or jsonb_array_length(p_filas) = 0 then
    raise exception 'El archivo no trae renglones.';
  end if;

  for v_fila in select value from jsonb_array_elements(p_filas)
  loop
    v_n := v_n + 1;
    select * into v_producto from productos where codigo = upper(btrim(v_fila->>'codigo'));
    if not found then
      raise exception 'Fila %: el código % no está en el libro.', v_n, v_fila->>'codigo';
    end if;

    v_tipo := upper(btrim(v_fila->>'tipo'))::tipo_movimiento;
    v_cantidad := (v_fila->>'cantidad')::numeric;
    v_destino := btrim(coalesce(v_fila->>'destinatario', ''));

    if v_tipo not in ('ENTRADA', 'SALIDA') then
      raise exception 'Fila %: el tipo debe ser ENTRADA o SALIDA.', v_n;
    end if;
    if v_tipo = 'SALIDA' and length(v_destino) = 0 then
      raise exception 'Fila %: la salida exige destinatario.', v_n;
    end if;

    select id into v_oficina from oficinas where lower(nombre) = lower(v_destino);
    v_ref := 'XLS-' || lpad(nextval('seq_excel')::text, 5, '0');

    insert into kardex_movimientos (
      producto_id, fecha, tipo_movimiento, cantidad, unidad_medida,
      destinatario, oficina_id, numero_referencia, concepto, usuario_nombre,
      es_auditoria, origen
    ) values (
      v_producto.id,
      coalesce((v_fila->>'fecha')::date, current_date),
      v_tipo,
      v_cantidad,
      v_producto.unidad_medida,
      v_destino,
      v_oficina,
      v_ref,
      coalesce(nullif(btrim(v_fila->>'concepto'), ''), 'Importación Excel/CSV'),
      p_usuario,
      coalesce((v_fila->>'es_auditoria')::boolean, false),
      'EXCEL'
    );
  end loop;

  return v_n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Vistas. El total del día agrupa por artículo y unidad, nunca entre unidades.
-- ---------------------------------------------------------------------------

create or replace view public.vista_stock
with (security_invoker = true) as
select
  p.id,
  p.codigo,
  p.nombre,
  p.unidad_medida,
  p.inventario_inicial,
  coalesce(sum(k.entradas), 0) as total_entradas,
  coalesce(sum(k.salidas), 0) as total_salidas,
  p.inventario_inicial + coalesce(sum(k.entradas), 0) - coalesce(sum(k.salidas), 0) as stock_actual
from productos p
left join kardex_movimientos k on k.producto_id = p.id
group by p.id;

create or replace view public.vista_kardex
with (security_invoker = true) as
select
  k.id,
  k.producto_id,
  k.fecha,
  k.tipo_movimiento,
  k.cantidad,
  k.entradas,
  k.salidas,
  k.stock_saldo,
  k.unidad_medida,
  k.destinatario,
  k.oficina_id,
  k.acta_id,
  k.acta_item_id,
  k.solicitud_id,
  k.solicitud_item_id,
  k.numero_referencia,
  k.concepto,
  k.usuario_nombre,
  k.es_auditoria,
  k.estado_auditoria,
  k.origen,
  k.idempotency_key,
  k.secuencia,
  k.created_at,
  p.codigo,
  p.nombre,
  p.inventario_inicial,
  a.numero as numero_acta,
  o.nombre as oficina_nombre
from kardex_movimientos k
join productos p on p.id = k.producto_id
left join actas_entrega a on a.id = k.acta_id
left join oficinas o on o.id = k.oficina_id;

create or replace view public.vista_total_dia
with (security_invoker = true) as
select
  k.fecha,
  k.producto_id,
  p.codigo,
  p.nombre,
  p.unidad_medida,
  sum(k.salidas) as total_despachado,
  string_agg(distinct k.destinatario, ' · ' order by k.destinatario) as destinatarios
from kardex_movimientos k
join productos p on p.id = k.producto_id
where k.tipo_movimiento = 'SALIDA'
group by k.fecha, k.producto_id, p.codigo, p.nombre, p.unidad_medida;

comment on view public.vista_total_dia is
  'Suma los despachos del mismo artículo en la fecha, aunque vayan a oficinas distintas. La unidad viaja en el grupo y no se promedia con otra.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table perfiles enable row level security;
alter table oficinas enable row level security;
alter table productos enable row level security;
alter table solicitudes enable row level security;
alter table solicitud_items enable row level security;
alter table actas_entrega enable row level security;
alter table acta_items enable row level security;
alter table kardex_movimientos enable row level security;

drop policy if exists perfiles_propia on perfiles;
create policy perfiles_propia on perfiles
  for select to authenticated
  using (id = auth.uid() or public.es_bodega());

drop policy if exists oficinas_lectura on oficinas;
create policy oficinas_lectura on oficinas
  for select to authenticated using (true);

drop policy if exists oficinas_escritura on oficinas;
create policy oficinas_escritura on oficinas
  for all to authenticated
  using (public.es_bodega())
  with check (public.es_bodega());

drop policy if exists productos_lectura on productos;
create policy productos_lectura on productos
  for select to authenticated using (true);

drop policy if exists productos_escritura on productos;
create policy productos_escritura on productos
  for all to authenticated
  using (public.es_bodega())
  with check (public.es_bodega());

drop policy if exists solicitudes_lectura on solicitudes;
create policy solicitudes_lectura on solicitudes
  for select to authenticated using (true);

drop policy if exists solicitudes_escritura on solicitudes;
create policy solicitudes_escritura on solicitudes
  for all to authenticated
  using (public.es_bodega())
  with check (public.es_bodega());

drop policy if exists solicitud_items_lectura on solicitud_items;
create policy solicitud_items_lectura on solicitud_items
  for select to authenticated using (true);

drop policy if exists solicitud_items_escritura on solicitud_items;
create policy solicitud_items_escritura on solicitud_items
  for all to authenticated
  using (public.es_bodega())
  with check (public.es_bodega());

drop policy if exists actas_lectura on actas_entrega;
create policy actas_lectura on actas_entrega
  for select to authenticated using (true);

drop policy if exists actas_escritura on actas_entrega;
create policy actas_escritura on actas_entrega
  for all to authenticated
  using (public.es_bodega())
  with check (public.es_bodega());

drop policy if exists acta_items_lectura on acta_items;
create policy acta_items_lectura on acta_items
  for select to authenticated using (true);

drop policy if exists acta_items_escritura on acta_items;
create policy acta_items_escritura on acta_items
  for all to authenticated
  using (public.es_bodega())
  with check (public.es_bodega());

drop policy if exists kardex_lectura on kardex_movimientos;
create policy kardex_lectura on kardex_movimientos
  for select to authenticated using (true);

-- El kárdex no se escribe directo: solo por las funciones, que son
-- security definer y respetan la llave de idempotencia.
revoke insert, update, delete on kardex_movimientos from authenticated, anon;
grant select on kardex_movimientos to authenticated;

grant select on vista_stock, vista_kardex, vista_total_dia to authenticated, service_role;
grant execute on function
  public.alta_producto(text, text, unidad_medida, numeric),
  public.crear_solicitud(text, uuid, text, text, date, text, jsonb),
  public.aprobar_solicitud(uuid, text),
  public.entregar_solicitud(uuid, text),
  public.registrar_entrada(uuid, numeric, date, text, text, boolean, origen_movimiento),
  public.salida_directa(uuid, text, date, text, text, boolean, jsonb),
  public.editar_movimiento(uuid, numeric, date, text, text, uuid, boolean, estado_auditoria, text),
  public.importar_excel(jsonb, text),
  public.recalcular_stock_producto(uuid)
to authenticated, service_role;

alter type origen_movimiento add value if not exists 'FACTURA';
alter type origen_movimiento add value if not exists 'COMPRA';

alter table productos add column if not exists precio numeric(14, 2) not null default 0;

create table if not exists cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  cliente text not null,
  fecha date not null,
  estado text not null check (estado in ('BORRADOR', 'ENVIADA', 'ACEPTADA', 'FACTURADA')),
  notas text not null default '',
  creado_por text not null,
  factura_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists facturas (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  cliente text not null,
  fecha date not null,
  cotizacion_id uuid references cotizaciones (id),
  notas text not null default '',
  creado_por text not null,
  estado text not null check (estado in ('EMITIDA', 'PAGADA')),
  stock_aplicado boolean not null default false,
  created_at timestamptz not null default now()
);

alter table cotizaciones
  drop constraint if exists cotizaciones_factura_id_fkey;

alter table cotizaciones
  add constraint cotizaciones_factura_id_fkey
  foreign key (factura_id) references facturas (id);

create table if not exists cotizacion_items (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizaciones (id) on delete cascade,
  producto_id uuid not null references productos (id),
  cantidad numeric(14, 3) not null check (cantidad > 0),
  precio numeric(14, 2) not null check (precio >= 0),
  unidad_medida unidad_medida not null,
  observacion text not null default ''
);

create table if not exists factura_items (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references facturas (id) on delete cascade,
  producto_id uuid not null references productos (id),
  cantidad numeric(14, 3) not null check (cantidad > 0),
  precio numeric(14, 2) not null check (precio >= 0),
  unidad_medida unidad_medida not null,
  observacion text not null default ''
);

-- ---------------------------------------------------------------------------
-- Turnos de Caja y Arqueo (Control de Mostrador)
-- ---------------------------------------------------------------------------

create table if not exists turnos_caja (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  usuario text not null,
  fecha_apertura timestamptz not null default now(),
  fecha_cierre timestamptz,
  monto_inicial numeric(14, 2) not null default 0 check (monto_inicial >= 0),
  monto_final_real numeric(14, 2),
  diferencia numeric(14, 2),
  total_ventas_efectivo numeric(14, 2) not null default 0,
  total_ventas_transferencia numeric(14, 2) not null default 0,
  total_ventas_tarjeta numeric(14, 2) not null default 0,
  total_ventas_credito numeric(14, 2) not null default 0,
  total_ingresos_extra numeric(14, 2) not null default 0,
  total_egresos numeric(14, 2) not null default 0,
  estado text not null default 'ABIERTO' check (estado in ('ABIERTO', 'CERRADO')),
  notas text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists movimientos_caja (
  id uuid primary key default gen_random_uuid(),
  turno_caja_id uuid not null references turnos_caja (id) on delete cascade,
  tipo text not null check (tipo in ('INGRESO', 'EGRESO')),
  monto numeric(14, 2) not null check (monto > 0),
  concepto text not null,
  usuario text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_turnos_caja_estado on turnos_caja (estado);
create index if not exists idx_movimientos_caja_turno on movimientos_caja (turno_caja_id);

-- ---------------------------------------------------------------------------
-- Clientes (CRM, RUC/Cédula y Control de Crédito Fiado)
-- ---------------------------------------------------------------------------

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ruc_cedula text not null default '',
  telefono text not null default '',
  direccion text not null default '',
  limite_credito numeric(14, 2) not null default 0 check (limite_credito >= 0),
  notas text not null default '',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_clientes_nombre on clientes (nombre);
create index if not exists idx_clientes_ruc on clientes (ruc_cedula);

-- ---------------------------------------------------------------------------
-- Proveedores (Distribuidores Mayoristas y Fabricantes)
-- ---------------------------------------------------------------------------

create table if not exists proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  ruc text not null default '',
  contacto text not null default '',
  telefono text not null default '',
  direccion text not null default '',
  notas text not null default '',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_proveedores_nombre on proveedores (nombre);

-- ---------------------------------------------------------------------------
-- Compras (Reabastecimiento con Costo Promedio Ponderado)
-- ---------------------------------------------------------------------------

create table if not exists compras (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  proveedor_id uuid references proveedores (id),
  proveedor text not null,
  fecha date not null,
  notas text not null default '',
  creado_por text not null,
  anulada boolean not null default false,
  total numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references compras (id) on delete cascade,
  producto_id uuid not null references productos (id),
  cantidad numeric(14, 3) not null check (cantidad > 0),
  costo_unitario numeric(14, 2) not null check (costo_unitario >= 0),
  observacion text not null default ''
);

create index if not exists idx_compras_fecha on compras (fecha);
create index if not exists idx_compras_proveedor on compras (proveedor_id);

-- ---------------------------------------------------------------------------
-- Gastos Operativos (Flujo de Caja y Utilidad Neta)
-- ---------------------------------------------------------------------------

create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  concepto text not null,
  categoria text not null default 'General',
  monto numeric(14, 2) not null check (monto > 0),
  notas text not null default '',
  creado_por text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gastos_fecha on gastos (fecha);
create index if not exists idx_gastos_categoria on gastos (categoria);

-- ---------------------------------------------------------------------------
-- Parámetros Globales del Sistema (Empresa, IVA, Moneda C$, Horarios)
-- ---------------------------------------------------------------------------

create table if not exists configuracion_sistema (
  id text primary key default 'global',
  datos jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Campos adicionales en productos para costeo y categorización
alter table productos add column if not exists costo numeric(14, 2) not null default 0;
alter table productos add column if not exists categoria text not null default 'Ferretería General';
alter table productos add column if not exists marca text not null default 'Genérica';
alter table productos add column if not exists stock_minimo numeric(14, 3) not null default 5;
alter table productos add column if not exists activo boolean not null default true;

create index if not exists idx_productos_marca on productos (marca);
create index if not exists idx_productos_categoria on productos (categoria);

-- Relaciones y campos financieros en facturas y cotizaciones
alter table facturas add column if not exists cliente_id uuid references clientes (id);
alter table facturas add column if not exists forma_pago text not null default 'EFECTIVO';
alter table facturas add column if not exists subtotal numeric(14, 2) not null default 0;
alter table facturas add column if not exists iva numeric(14, 2) not null default 0;
alter table facturas add column if not exists total numeric(14, 2) not null default 0;
alter table facturas add column if not exists anulada boolean not null default false;
alter table facturas add column if not exists descuento numeric(14, 2) not null default 0;
alter table facturas add column if not exists impuesto numeric(14, 2) not null default 0;
alter table facturas add column if not exists idempotency_key text;
create unique index if not exists uq_facturas_idempotency on facturas (idempotency_key) where idempotency_key is not null;

alter table compras add column if not exists subtotal numeric(14, 2) not null default 0;
alter table compras add column if not exists impuesto numeric(14, 2) not null default 0;
alter table compras add column if not exists idempotency_key text;
create unique index if not exists uq_compras_idempotency on compras (idempotency_key) where idempotency_key is not null;

alter table productos add column if not exists total_entradas numeric(14, 3) not null default 0;
alter table productos add column if not exists total_salidas numeric(14, 3) not null default 0;
alter table productos add column if not exists actualizado_en timestamptz not null default now();

alter table cotizaciones add column if not exists cliente_id uuid references clientes (id);
alter table cotizaciones add column if not exists subtotal numeric(14, 2) not null default 0;
alter table cotizaciones add column if not exists iva numeric(14, 2) not null default 0;
alter table cotizaciones add column if not exists total numeric(14, 2) not null default 0;

-- ---------------------------------------------------------------------------
-- Blindaje de Seguridad: Row Level Security (RLS) en todas las tablas comerciales
-- ---------------------------------------------------------------------------

alter table turnos_caja enable row level security;
alter table movimientos_caja enable row level security;
alter table cotizaciones enable row level security;
alter table cotizacion_items enable row level security;
alter table facturas enable row level security;
alter table factura_items enable row level security;
alter table usuarios_sistema enable row level security;
alter table clientes enable row level security;
alter table proveedores enable row level security;
alter table compras enable row level security;
alter table compra_items enable row level security;
alter table gastos enable row level security;
alter table configuracion_sistema enable row level security;

-- Políticas de Turnos y Movimientos de Caja
drop policy if exists turnos_lectura on turnos_caja;
create policy turnos_lectura on turnos_caja
  for select to authenticated using (true);

drop policy if exists turnos_escritura on turnos_caja;
create policy turnos_escritura on turnos_caja
  for all to authenticated using (true) with check (true);

drop policy if exists movs_caja_lectura on movimientos_caja;
create policy movs_caja_lectura on movimientos_caja
  for select to authenticated using (true);

drop policy if exists movs_caja_escritura on movimientos_caja;
create policy movs_caja_escritura on movimientos_caja
  for all to authenticated using (true) with check (true);

-- Políticas de Cotizaciones y Facturas
drop policy if exists cotizaciones_lectura on cotizaciones;
create policy cotizaciones_lectura on cotizaciones
  for select to authenticated using (true);

drop policy if exists cotizaciones_escritura on cotizaciones;
create policy cotizaciones_escritura on cotizaciones
  for all to authenticated using (true) with check (true);

drop policy if exists cotizacion_items_lectura on cotizacion_items;
create policy cotizacion_items_lectura on cotizacion_items
  for select to authenticated using (true);

drop policy if exists cotizacion_items_escritura on cotizacion_items;
create policy cotizacion_items_escritura on cotizacion_items
  for all to authenticated using (true) with check (true);

drop policy if exists facturas_lectura on facturas;
create policy facturas_lectura on facturas
  for select to authenticated using (true);

drop policy if exists facturas_escritura on facturas;
create policy facturas_escritura on facturas
  for all to authenticated using (true) with check (true);

drop policy if exists factura_items_lectura on factura_items;
create policy factura_items_lectura on factura_items
  for select to authenticated using (true);

drop policy if exists factura_items_escritura on factura_items;
create policy factura_items_escritura on factura_items
  for all to authenticated using (true) with check (true);

-- Políticas de Clientes y Proveedores (CRM)
drop policy if exists clientes_lectura on clientes;
create policy clientes_lectura on clientes
  for select to authenticated using (true);

drop policy if exists clientes_escritura on clientes;
create policy clientes_escritura on clientes
  for all to authenticated using (true) with check (true);

drop policy if exists proveedores_lectura on proveedores;
create policy proveedores_lectura on proveedores
  for select to authenticated using (true);

drop policy if exists proveedores_escritura on proveedores;
create policy proveedores_escritura on proveedores
  for all to authenticated using (true) with check (true);

-- Políticas de Compras y Gastos
drop policy if exists compras_lectura on compras;
create policy compras_lectura on compras
  for select to authenticated using (true);

drop policy if exists compras_escritura on compras;
create policy compras_escritura on compras
  for all to authenticated using (true) with check (true);

drop policy if exists compra_items_lectura on compra_items;
create policy compra_items_lectura on compra_items
  for select to authenticated using (true);

drop policy if exists compra_items_escritura on compra_items;
create policy compra_items_escritura on compra_items
  for all to authenticated using (true) with check (true);

drop policy if exists gastos_lectura on gastos;
create policy gastos_lectura on gastos
  for select to authenticated using (true);

drop policy if exists gastos_escritura on gastos;
create policy gastos_escritura on gastos
  for all to authenticated using (true) with check (true);

-- Políticas de Configuración del Sistema
drop policy if exists config_lectura on configuracion_sistema;
create policy config_lectura on configuracion_sistema
  for select to authenticated using (true);

drop policy if exists config_escritura on configuracion_sistema;
create policy config_escritura on configuracion_sistema
  for all to authenticated using (public.es_bodega()) with check (public.es_bodega());

-- Protección estricta de Usuarios del Sistema: solo el rol de servicio o administrador
drop policy if exists usuarios_sistema_admin on usuarios_sistema;
create policy usuarios_sistema_admin on usuarios_sistema
  for all to authenticated
  using (public.es_bodega())
  with check (public.es_bodega());

-- Revocar cualquier acceso público anónimo (anon role)
revoke all on turnos_caja, movimientos_caja, cotizaciones, cotizacion_items,
  facturas, factura_items, clientes, proveedores, compras, compra_items,
  gastos, configuracion_sistema, usuarios_sistema from anon;

grant select, insert, update, delete on turnos_caja, movimientos_caja, cotizaciones,
  cotizacion_items, facturas, factura_items, clientes, proveedores, compras,
  compra_items, gastos, configuracion_sistema to authenticated, service_role;

grant select, insert, update, delete on usuarios_sistema to service_role;

