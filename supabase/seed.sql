-- =========================================================================
--  NYC COOKIES — Seed data
--  Run AFTER schema.sql.
--
--  Only the product catalog is seeded. Customers, pros, orders and invoices
--  are populated organically as real users sign up and use the app:
--    - B2C customers: auto-created on first signed-in visit (lib/auth.ts)
--    - Pros:          created by admin via /admin/pros → "Inviter un pro"
--    - Orders:        placed via /shop or /pro/order
--    - Invoices:      auto-generated when a pro places an order
-- =========================================================================

insert into public.products (id, name, description, category, price_mad, stock, active, image_url) values
  ('p_soho',     'Soho',               'Beurre noisette, pépites de chocolat noir 70%.',          'cookie',   28,  120, true, null),
  ('p_central',  'Central Park',       'Chocolat lait & noir, fleur de sel.',                      'cookie',   28,  80,  true, null),
  ('p_bronx',    'Bronx',              'Cacahuètes caramélisées, chocolat noir.',                  'cookie',   30,  60,  true, null),
  ('p_times',    'Times Square',       'Chocolat blanc, cranberries & vanille de Madagascar.',     'cookie',   30,  75,  true, null),
  ('p_madison',  'Madison Square',     'Caramel beurre salé fondant en cœur.',                     'cookie',   32,  50,  true, null),
  ('p_pinkv',    'Pink Velvet',        'Red velvet, cream cheese, pépites blanches.',              'cookie',   32,  40,  true, null),
  ('p_rikers',   'Rikers Island',      'Triple chocolat noir intense, oreo concassé.',             'cookie',   30,  55,  true, null),
  ('p_full',     'Full Choco',         'Chocolat × chocolat × chocolat. Pour les fans.',           'cookie',   30,  70,  true, null),
  ('p_italy',    'Little Italy',       'Pistache, amande, ricotta façon cannoli.',                 'cookie',   32,  45,  true, null),
  ('p_box_m',    'Cookies Box Medium', '6 cookies au choix, parfait pour partager.',               'box',      160, 30,  true, null),
  ('p_box_xl',   'Cookies Box XL',     '12 cookies au choix, pour les grandes occasions.',         'box',      300, 18,  true, null),
  ('p_icecream', 'Cookie Ice Cream',   'Sandwich glacé entre 2 cookies maison.',                   'icecream', 38,  25,  true, null)
on conflict (id) do nothing;
