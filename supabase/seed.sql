-- =========================================================================
--  NYC COOKIES — Catalogue officiel Casablanca
--  12 cookies (4 collections) + formats Grand / Mini — sans glaces
--  Modifiable ensuite via /admin/products
-- =========================================================================

insert into public.products (id, name, description, category, price_mad, stock, active, image_url) values
  -- Les Iconiques — 25 MAD
  ('p_brooklyn',      'Brooklyn',              'Les Iconiques — 100% chocolat et brownie — intense, fondant, pur cacao.',                    'cookie', 25, 42, true, null),
  ('p_harlem',        'Harlem',                'Les Iconiques — Chocolat & noix, fondant et croquant.',                                        'cookie', 25, 37, true, null),
  ('p_times_square',  'Times Square',          'Les Iconiques — Cœur chocolat intense, nutella.',                                              'cookie', 25, 55, true, null),
  -- Les Audacieux — 28 MAD
  ('p_rikers',        'Rikers Island',         'Les Audacieux — Crème spéculoos, cœur chocolat blanc, lotus.',                               'cookie', 28, 29, true, null),
  ('p_bronx',         'Bronx',                 'Les Audacieux — Cœur Milka caramel, chocolat caramel.',                                        'cookie', 28, 33, true, null),
  ('p_staten_island', 'Staten Island',         'Les Audacieux — Cœur pépites de chocolat, chocolat blanc Kinder Maxi.',                      'cookie', 28, 18, true, null),
  -- Les Élite — 32 MAD
  ('p_soho',          'Soho',                  'Les Élite — Crème Kunafa citron, zeste de citron vert et framboise.',                          'cookie', 32, 22, true, null),
  ('p_little_italy',  'Little Italy',          'Les Élite — Tiramisu, cœur mascarpone, touche cacao.',                                         'cookie', 32, 15, true, null),
  ('p_central_park',  'Central Park',          'Les Élite — Cœur pomme, cannelle et caramel.',                                                 'cookie', 32, 27, true, null),
  -- Les Gourmets — 35 MAD
  ('p_pink_velvet',   'Pink Velvet',           'Les Gourmets — Red velvet, cœur crème cheese, chocolat blanc et framboise.',                   'cookie', 35, 12, true, null),
  ('p_wall_street',   'Wall Street',           'Les Gourmets — Cœur crème Bueno, chocolat Kinder Bueno.',                                      'cookie', 35, 19, true, null),
  ('p_madison_square','Madison Square',        'Les Gourmets — Cœur crème pistache, framboise et éclats de pistache.',                         'cookie', 35,  8, true, null),
  -- Formats partenaire
  ('p_grand_cookie',  'Grand Cookie Signature','Formats partenaire — Format standard, toutes saveurs (tarif partenaire).',                    'box',    15, 200, true, null),
  ('p_mini_cookie',   'Mini Cookie',           'Formats partenaire — Réplique miniature des saveurs signature (tarif partenaire).',            'box',     9, 200, true, null)
on conflict (id) do update set
  name         = excluded.name,
  description  = excluded.description,
  category     = excluded.category,
  price_mad    = excluded.price_mad,
  stock        = excluded.stock,
  active       = true,
  updated_at   = now();

-- Anciens produits hors catalogue (boxes génériques, glaces, recettes obsolètes)
update public.products set active = false, updated_at = now()
where id in (
  'p_central', 'p_times', 'p_madison', 'p_pinkv', 'p_italy', 'p_full',
  'p_box_m', 'p_box_xl', 'p_icecream'
);
