-- Base schema for Guia Turistica Catamarca

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tourist_points (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  category text not null,
  address text,
  schedule text,
  recommended_duration text,
  entry_fee text,
  recommended_for text,
  services text[] not null default '{}',
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tourist_points_latitude_check check (latitude between -90 and 90),
  constraint tourist_points_longitude_check check (longitude between -180 and 180)
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  point_id text not null references public.tourist_points (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, point_id)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_point_id_idx on public.favorites (point_id);
create index if not exists tourist_points_slug_idx on public.tourist_points (slug);

insert into public.tourist_points (
  id,
  slug,
  name,
  description,
  category,
  address,
  schedule,
  recommended_duration,
  entry_fee,
  recommended_for,
  services,
  latitude,
  longitude,
  image_urls
)
values
  (
    '1',
    'catedral-basilica-nuestra-senora-del-valle',
    'Catedral Basílica de Nuestra Señora del Valle',
    'Templo religioso emblemático de la ciudad de San Fernando del Valle de Catamarca.',
    'Patrimonio religioso e historico',
    'Sarmiento 550, San Fernando del Valle de Catamarca',
    'Lunes a domingo, 08:00 a 20:00',
    '45 a 60 minutos',
    'Entrada libre y gratuita',
    'Turismo cultural, fotografia y visitas familiares',
    array['Visitas guiadas', 'Acceso peatonal', 'Zona centrica con cafeterias'],
    -28.4696000,
    -65.7795000,
    array['/assets/images/catedral.jpg']
  ),
  (
    '2',
    'dique-el-jumeal',
    'Dique El Jumeal',
    'Espacio natural ideal para caminatas, deportes y actividades al aire libre.',
    'Naturaleza y recreacion',
    'Av. Bartolome de Castro, El Jumeal, Catamarca',
    'Abierto las 24 horas',
    '1 a 2 horas',
    'Sin costo',
    'Senderismo suave, ciclismo y mateadas al atardecer',
    array['Estacionamiento cercano', 'Circuito peatonal', 'Miradores'],
    -28.4642000,
    -65.7861000,
    array['/assets/images/jumeal.webp']
  ),
  (
    '3',
    'cuesta-del-portezuelo',
    'Cuesta del Portezuelo',
    'Mirador panorámico con vistas espectaculares de la provincia.',
    'Mirador y paisaje de montana',
    'Ruta Provincial 2, camino a El Portezuelo, Catamarca',
    'Todos los dias, recomendable de 09:00 a 19:00',
    '1 hora',
    'Acceso gratuito',
    'Fotografia panoramica y recorridos en auto',
    array['Miradores naturales', 'Paradas escenicas', 'Acceso vehicular'],
    -28.4967000,
    -65.6502000,
    array['/assets/images/portezuelo.jpg']
  )
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  address = excluded.address,
  schedule = excluded.schedule,
  recommended_duration = excluded.recommended_duration,
  entry_fee = excluded.entry_fee,
  recommended_for = excluded.recommended_for,
  services = excluded.services,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  image_urls = excluded.image_urls,
  updated_at = now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.email
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists on_tourist_points_updated on public.tourist_points;
create trigger on_tourist_points_updated
before update on public.tourist_points
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of raw_user_meta_data, email on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tourist_points enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner" on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Profiles are editable by owner" on public.profiles;
create policy "Profiles are editable by owner" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Tourist points are viewable by everyone" on public.tourist_points;
create policy "Tourist points are viewable by everyone" on public.tourist_points
  for select
  using (true);

drop policy if exists "Tourist points can be managed by authenticated users" on public.tourist_points;
create policy "Tourist points can be managed by authenticated users" on public.tourist_points
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Tourist points can be updated by authenticated users" on public.tourist_points;
create policy "Tourist points can be updated by authenticated users" on public.tourist_points
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Tourist points can be deleted by authenticated users" on public.tourist_points;
create policy "Tourist points can be deleted by authenticated users" on public.tourist_points
  for delete
  using (auth.role() = 'authenticated');

drop policy if exists "Favorites are readable by owner" on public.favorites;
create policy "Favorites are readable by owner" on public.favorites
  for select
  using (auth.uid() = user_id);

drop policy if exists "Favorites are insertable by owner" on public.favorites;
create policy "Favorites are insertable by owner" on public.favorites
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Favorites are deletable by owner" on public.favorites;
create policy "Favorites are deletable by owner" on public.favorites
  for delete
  using (auth.uid() = user_id);
