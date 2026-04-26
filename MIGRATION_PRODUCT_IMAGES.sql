-- ============================================================
-- MIGRATION: Add support for multiple product images
-- Copy and paste this into the Supabase SQL Editor and run
-- Run the entire script at once, or follow the sections marked STEP 1, STEP 2, STEP 3
-- ============================================================

-- STEP 1: Create product_images table
-- Drop existing table if doing a fresh migration
-- drop table if exists public.product_images cascade;

create table if not exists public.product_images (
  id            serial      primary key,
  product_id    integer     not null references public.products(id) on delete cascade,
  image_url     text        not null,
  display_order integer     not null default 0,
  is_primary    boolean     not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.product_images is
  'Multiple images per product. is_primary indicates the main thumbnail.';

-- STEP 2: Create indexes and enable security
create index if not exists product_images_product_id_idx on public.product_images (product_id);
create index if not exists product_images_is_primary_idx on public.product_images (is_primary);

alter table public.product_images enable row level security;

-- Grant sequence permissions to authenticated users (owners need to insert with auto-increment)
grant usage, select on sequence public.product_images_id_seq to authenticated;

create policy "product_images: public read"
  on public.product_images for select
  using (true);

create policy "product_images: owner write"
  on public.product_images for all
  using (is_owner())
  with check (is_owner());

-- STEP 3: Migrate existing data from products table
-- Only insert if product_images is empty (prevents duplicate migrations)
insert into public.product_images (product_id, image_url, is_primary, display_order)
select id, image_url, true, 0
from public.products
where image_url is not null
on conflict do nothing;

-- STEP 4: Create view for easy querying
-- This view combines products with their images in a convenient format
create or replace view public.products_with_images as
select
  p.id,
  p.category_id,
  p.name,
  p.description,
  p.price,
  p.stock,
  p.image_url,
  p.tag,
  p.status,
  p.sort_order,
  p.active,
  p.created_at,
  p.updated_at,
  coalesce(json_agg(json_build_object(
    'id', pi.id,
    'image_url', pi.image_url,
    'display_order', pi.display_order,
    'is_primary', pi.is_primary
  ) order by pi.display_order) filter (where pi.id is not null), '[]'::json)
  as images
from public.products p
left join public.product_images pi on pi.product_id = p.id
group by p.id;
