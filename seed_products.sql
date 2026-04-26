-- ============================================================
--  SEED DATA — Run this in Supabase SQL Editor AFTER supabase.sql
--  Inserts all products from the old data/products.js file
-- ============================================================

-- Category 1: bracklets (Bracelets & Jewelry)
INSERT INTO products (category_id, name, price, stock, image_url, tag, sort_order) VALUES
  (1, 'Watch Sets',    38, 20, 'silverwatch.png', 'Popular', 1),
  (1, 'Silver Set I',  45, 15, 'silver1.png',      NULL, 2),
  (1, 'Silver Set II', 45, 15, 'silver2.png',      NULL, 3),
  (1, 'Chair Cover',   65, 10, 'chairc.png',       NULL, 4),
  (1, 'Stanley Cup',   38, 25, 'stanley.png',     'Hot',  5),
  (1, 'Gold Set',      55, 12, 'gold.png',         NULL, 6),
  (1, 'Gold Jewelry',  60, 8,  'goldj.png',        NULL, 7),
  (1, 'Gold Set II',   60, 8,  'gold2j.png',       NULL, 8),
  (1, 'Gold Set III',  60, 8,  'gold3j.png',       NULL, 9);

-- Category 2: anklets (Makeup & Beauty)
INSERT INTO products (category_id, name, price, stock, image_url, tag, sort_order) VALUES
  (2, 'Contour',             6,  30, 'make1.png',    NULL,  1),
  (2, 'Butterfly Lipstick',  12, 20, 'make2.png',   'New',  2),
  (2, 'Butterfly Lipstick',  12, 20, 'make3.png',    NULL,  3),
  (2, 'Triangle Sponge',     3,  50, 'make4.png',    NULL,  4),
  (2, 'Blush Powder',        5,  40, 'make6.png',    NULL,  5),
  (2, 'Blush Powder',        5,  40, 'make7.png',    NULL,  6),
  (2, 'Blush Powder',        5,  40, 'make8.png',    NULL,  7),
  (2, 'Hello Kitty Perfume', 8,  15, 'make10.png',  'Hot',  8),
  (2, 'Makeup Bundle',       15, 10, 'make11.png',   NULL,  9),
  (2, 'Makeup Set',          18, 10, 'make12.png',   NULL, 10),
  (2, 'Retinol Serum',       10, 25, 'retinol.png', 'New', 11);

-- Category 3: waistchains (Waist Chains) — first 10
INSERT INTO products (category_id, name, price, stock, image_url, tag, sort_order) VALUES
  (3, 'Waist Chain Style 1',  15, 20, 'waistchain1.png',  'Popular', 1),
  (3, 'Waist Chain Style 2',  18, 20, 'waistchain2.png',  'Popular', 2),
  (3, 'Waist Chain Style 3',  20, 20, 'waistchain3.png',  'Popular', 3),
  (3, 'Waist Chain Style 4',  22, 20, 'waistchain4.png',   NULL, 4),
  (3, 'Waist Chain Style 5',  25, 20, 'waistchain5.png',   NULL, 5),
  (3, 'Waist Chain Style 6',  15, 20, 'waistchain6.png',   NULL, 6),
  (3, 'Waist Chain Style 7',  18, 20, 'waistchain7.png',   NULL, 7),
  (3, 'Waist Chain Style 8',  20, 20, 'waistchain8.png',   NULL, 8),
  (3, 'Waist Chain Style 9',  22, 20, 'waistchain9.png',   NULL, 9),
  (3, 'Waist Chain Style 10', 25, 20, 'waistchain10.png',  NULL, 10);

-- Waist Chains 11–20
INSERT INTO products (category_id, name, price, stock, image_url, tag, sort_order) VALUES
  (3, 'Waist Chain Style 11', 15, 20, 'waistchain11.png', NULL, 11),
  (3, 'Waist Chain Style 12', 18, 20, 'waistchain12.png', NULL, 12),
  (3, 'Waist Chain Style 13', 20, 20, 'waistchain13.png', NULL, 13),
  (3, 'Waist Chain Style 14', 22, 20, 'waistchain14.png', NULL, 14),
  (3, 'Waist Chain Style 15', 25, 20, 'waistchain15.png', NULL, 15),
  (3, 'Waist Chain Style 16', 15, 20, 'waistchain16.png', NULL, 16),
  (3, 'Waist Chain Style 17', 18, 20, 'waistchain17.png', NULL, 17),
  (3, 'Waist Chain Style 18', 20, 20, 'waistchain18.png', NULL, 18),
  (3, 'Waist Chain Style 19', 22, 20, 'waistchain19.png', NULL, 19),
  (3, 'Waist Chain Style 20', 25, 20, 'waistchain20.png', NULL, 20);

-- Waist Chains 21–30
INSERT INTO products (category_id, name, price, stock, image_url, tag, sort_order) VALUES
  (3, 'Waist Chain Style 21', 15, 20, 'waistchain21.png', NULL, 21),
  (3, 'Waist Chain Style 22', 18, 20, 'waistchain22.png', NULL, 22),
  (3, 'Waist Chain Style 23', 20, 20, 'waistchain23.png', NULL, 23),
  (3, 'Waist Chain Style 24', 22, 20, 'waistchain24.png', NULL, 24),
  (3, 'Waist Chain Style 25', 25, 20, 'waistchain25.png', NULL, 25),
  (3, 'Waist Chain Style 26', 15, 20, 'waistchain26.png', NULL, 26),
  (3, 'Waist Chain Style 27', 18, 20, 'waistchain27.png', NULL, 27),
  (3, 'Waist Chain Style 28', 20, 20, 'waistchain28.png', NULL, 28),
  (3, 'Waist Chain Style 29', 22, 20, 'waistchain29.png', NULL, 29),
  (3, 'Waist Chain Style 30', 25, 20, 'waistchain30.png', NULL, 30);

-- Category 4: necklaces (Bags & Accessories)
INSERT INTO products (category_id, name, price, stock, image_url, tag, sort_order) VALUES
  (4, 'Trendy Bag',        35, 10, 'bag1.png',  'New',     1),
  (4, 'Leather Crossbody', 48, 8,  'bag2.png',  'Popular', 2),
  (4, 'Canvas Tote',       32, 12, 'bag3.png',   NULL,     3),
  (4, 'Woven Beach Bag',   28, 15, 'bag4.png',   NULL,     4),
  (4, 'Boho Shoulder Bag', 42, 6,  'bag5.png',  'Hot',     5),
  (4, 'Small Crossbody',   25, 20, 'bag6.png',   NULL,     6),
  (4, 'Vintage Messenger', 55, 5,  'bag7.png',   NULL,     7),
  (4, 'Weekend Duffel',    52, 7,  'bag8.png',   NULL,     8);

-- Category 5: earrings (Apparel & Tops)
INSERT INTO products (category_id, name, price, stock, image_url, tag, sort_order) VALUES
  (5, 'Floral Dress',     45, 10, 'dress1.png',     NULL,      1),
  (5, 'White Dress',      40, 8,  'whitedress.png',  NULL,      2),
  (5, 'Karol G Tee',      20, 30, 'karolm.png',     'Hot',     3),
  (5, 'Kuromi Tee',       18, 25, 'kuromi.png',      NULL,      4),
  (5, 'Hello Kitty Tee',  18, 25, 'kitty.png',       NULL,      5),
  (5, 'My Little Pony',   18, 25, 'pony.png',        NULL,      6),
  (5, 'Minnie Mouse',     18, 25, 'minne.png',       NULL,      7),
  (5, 'Blossom Tee',      18, 25, 'blossom.png',     NULL,      8),
  (5, 'Princess Tee',     18, 20, 'princess.png',     NULL,      9),
  (5, 'Ultra Modern',     22, 15, 'ultramo.png',      NULL,     10),
  (5, 'Ultra Modern II',  22, 15, 'ultramo1.png',     NULL,     11),
  (5, 'America Tee',      20, 20, 'america.png',      NULL,     12),
  (5, 'Chivas Jersey',    30, 10, 'chivas.png',     'Popular', 13),
  (5, 'Cruz Azul Jersey', 30, 10, 'cruzazul.png',   'Popular', 14),
  (5, 'Express Tee',      22, 18, 'express.png',      NULL,     15),
  (5, 'Graphic Tee',      18, 22, 'sticky.png',       NULL,     16);
