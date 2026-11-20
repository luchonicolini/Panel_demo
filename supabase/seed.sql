-- ============================================================================
-- Datos de ejemplo · Nicolini Import
-- Ejecutar después de la migración inicial.
-- Las imágenes viven en /public/products del repositorio.
-- ============================================================================

insert into public.categories (id, name, slug, sort_order, created_at) values
  ('a1000000-0000-4000-8000-000000000001', 'Auriculares', 'auriculares', 0, '2026-10-01T10:00:00Z'),
  ('a1000000-0000-4000-8000-000000000002', 'Teclados', 'teclados', 1, '2026-10-01T10:01:00Z'),
  ('a1000000-0000-4000-8000-000000000003', 'Parlantes', 'parlantes', 2, '2026-10-01T10:02:00Z'),
  ('a1000000-0000-4000-8000-000000000004', 'Mouse', 'mouse', 3, '2026-10-01T10:03:00Z'),
  ('a1000000-0000-4000-8000-000000000005', 'Accesorios', 'accesorios', 4, '2026-10-01T10:04:00Z')
on conflict do nothing;

insert into public.products
  (id, name, slug, description, sku, category_id, price, stock, status, created_at, updated_at)
values
  (
    'b1000000-0000-4000-8000-000000000001',
    'Auriculares inalámbricos Pro',
    'auriculares-inalambricos-pro',
    'Auriculares over-ear con cancelación activa de ruido, hasta 40 horas de batería y estuche rígido de viaje. Ideales para trabajo, estudio y viajes largos.',
    'NI-AUR-001',
    'a1000000-0000-4000-8000-000000000001',
    129900, 6, 'published',
    '2026-11-18T13:20:00Z', '2026-11-18T13:20:00Z'
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'Teclado mecánico RGB',
    'teclado-mecanico-rgb',
    'Teclado mecánico compacto con switches táctiles, iluminación RGB configurable y estructura de aluminio. Incluye cable USB-C desmontable.',
    'NI-TEC-008',
    'a1000000-0000-4000-8000-000000000002',
    89900, 14, 'published',
    '2026-11-17T11:05:00Z', '2026-11-17T11:05:00Z'
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'Parlante portátil Bluetooth',
    'parlante-portatil-bluetooth',
    'Parlante resistente al agua con sonido estéreo, correa de transporte y 18 horas de reproducción. Se conecta con dos dispositivos a la vez.',
    'NI-PAR-004',
    'a1000000-0000-4000-8000-000000000003',
    79900, 4, 'published',
    '2026-11-16T16:40:00Z', '2026-11-16T16:40:00Z'
  ),
  (
    'b1000000-0000-4000-8000-000000000004',
    'Mouse inalámbrico ergonómico',
    'mouse-inalambrico-ergonomico',
    'Mouse ergonómico con sensor silencioso, conexión inalámbrica 2.4 GHz y Bluetooth. Batería recargable de larga duración.',
    'NI-MOU-003',
    'a1000000-0000-4000-8000-000000000004',
    24900, 32, 'published',
    '2026-11-15T09:15:00Z', '2026-11-15T09:15:00Z'
  ),
  (
    'b1000000-0000-4000-8000-000000000005',
    'Hub USB-C 7 en 1',
    'hub-usb-c-7-en-1',
    'Adaptador USB-C con HDMI 4K, lector SD, dos puertos USB 3.0 y carga rápida de 100 W. Compacto, ideal para notebook.',
    'NI-ACC-011',
    'a1000000-0000-4000-8000-000000000005',
    39900, 0, 'published',
    '2026-11-14T15:30:00Z', '2026-11-14T15:30:00Z'
  ),
  (
    'b1000000-0000-4000-8000-000000000006',
    'Soporte para notebook',
    'soporte-para-notebook',
    'Soporte de aluminio regulable en altura, con base antideslizante y ventilación abierta. Compatible con notebooks de 11 a 17 pulgadas.',
    'NI-ACC-012',
    'a1000000-0000-4000-8000-000000000005',
    18900, 22, 'published',
    '2026-11-13T12:10:00Z', '2026-11-13T12:10:00Z'
  ),
  (
    'b1000000-0000-4000-8000-000000000007',
    'Auriculares inalámbricos Lite',
    'auriculares-inalambricos-lite',
    'Versión liviana de nuestros auriculares inalámbricos. Batería de 24 horas y controles táctiles. Borrador pendiente de fotos finales.',
    'NI-AUR-002',
    'a1000000-0000-4000-8000-000000000001',
    59900, 12, 'draft',
    '2026-11-12T10:00:00Z', '2026-11-12T10:00:00Z'
  ),
  (
    'b1000000-0000-4000-8000-000000000008',
    'Webcam Full HD',
    'webcam-full-hd',
    'Cámara Full HD con micrófono integrado y corrección de luz. Producto descontinuado, archivado para referencia.',
    'NI-ACC-013',
    'a1000000-0000-4000-8000-000000000005',
    45900, 0, 'archived',
    '2026-11-10T10:00:00Z', '2026-11-11T10:00:00Z'
  )
on conflict do nothing;

insert into public.product_images (id, product_id, url, alt, sort_order) values
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '/products/auriculares.svg', 'Auriculares inalámbricos Pro', 0),
  ('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', '/products/teclado.svg', 'Teclado mecánico RGB', 0),
  ('c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', '/products/parlante.svg', 'Parlante portátil Bluetooth', 0),
  ('c1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000004', '/products/mouse.svg', 'Mouse inalámbrico ergonómico', 0),
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000005', '/products/hub.svg', 'Hub USB-C 7 en 1', 0),
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000006', '/products/soporte.svg', 'Soporte para notebook', 0),
  ('c1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000007', '/products/auriculares.svg', 'Auriculares inalámbricos Lite', 0),
  ('c1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000008', '/products/webcam.svg', 'Webcam Full HD', 0)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Primer administrador
-- 1. Creá el usuario en Authentication > Users (o con scripts/bootstrap-admin.mjs).
-- 2. Asignale permisos de administración:
--
-- insert into public.admin_users (user_id, email)
-- select id, email from auth.users where email = 'tu@email.com'
-- on conflict (user_id) do nothing;
-- ---------------------------------------------------------------------------
