-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home'::text,
  full_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  district text NOT NULL,
  country text NOT NULL DEFAULT 'Belize'::text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.cart_items (
  id integer NOT NULL DEFAULT nextval('cart_items_id_seq'::regclass),
  customer_id uuid NOT NULL,
  product_id integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 99),
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customer_contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  type text,
  value text,
  CONSTRAINT customer_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT customer_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory_items (
  id integer NOT NULL DEFAULT nextval('inventory_items_id_seq'::regclass),
  name text NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text NOT NULL DEFAULT 'pcs'::text,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  supplier text,
  cost_per_unit numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory_levels (
  inventory_item_id uuid NOT NULL,
  quantity numeric DEFAULT 0 CHECK (quantity >= 0::numeric),
  low_stock_threshold numeric DEFAULT 10 CHECK (low_stock_threshold >= 0::numeric),
  CONSTRAINT inventory_levels_pkey PRIMARY KEY (inventory_item_id)
);
CREATE TABLE public.inventory_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inventory_item_id uuid NOT NULL,
  change numeric NOT NULL,
  reason text,
  reference_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reference_id text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  event text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id text NOT NULL,
  product_id integer,
  product_name text NOT NULL,
  product_image text,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL CHECK (quantity >= 1),
  subtotal numeric DEFAULT (unit_price * (quantity)::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id text NOT NULL,
  customer_id uuid,
  guest_name text,
  guest_email text,
  guest_phone text,
  delivery_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  district text NOT NULL,
  country text NOT NULL DEFAULT 'Belize'::text,
  delivery_notes text,
  shipping_method text NOT NULL DEFAULT 'standard'::text CHECK (shipping_method = ANY (ARRAY['standard'::text, 'express'::text, 'pickup'::text])),
  shipping_cost numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL,
  total numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash_on_delivery'::text CHECK (payment_method = ANY (ARRAY['cash_on_delivery'::text, 'bank_transfer'::text, 'card'::text])),
  payment_status text NOT NULL DEFAULT 'unpaid'::text CHECK (payment_status = ANY (ARRAY['unpaid'::text, 'paid'::text, 'refunded'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in-progress'::text, 'ready'::text, 'delivered'::text, 'cancelled'::text])),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.product_images (
  id integer NOT NULL DEFAULT nextval('product_images_id_seq'::regclass),
  product_id integer NOT NULL,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_materials (
  product_variant_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  quantity_required numeric NOT NULL CHECK (quantity_required > 0::numeric),
  CONSTRAINT product_materials_pkey PRIMARY KEY (product_variant_id, inventory_item_id),
  CONSTRAINT product_materials_product_variant_id_fkey FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid,
  sku text UNIQUE,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  cost numeric CHECK (cost >= 0::numeric),
  currency text DEFAULT 'BZD'::text,
  active boolean DEFAULT true,
  CONSTRAINT product_variants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id integer NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  category_id integer NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  tag text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'low'::text, 'out'::text, 'archived'::text])),
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  role text NOT NULL DEFAULT 'customer'::text CHECK (role = ANY (ARRAY['customer'::text, 'owner'::text])),
  newsletter boolean NOT NULL DEFAULT false,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.store_settings (
  key text NOT NULL,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  address text,
  currency text,
  tagline text,
  shipping_zones text,
  whatsapp text,
  instagram text,
  CONSTRAINT store_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone text,
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);