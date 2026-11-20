# Changelog

Todas las versiones relevantes de este proyecto se documentan acá.

## [1.0.0] - 2026-11-20

### Added

- Catálogo público con productos publicados, estado de stock y consulta por WhatsApp.
- Panel de administración con CRUD de productos, estados, duplicado, archivo y restauración.
- Edición rápida de precio y stock en desktop y mobile.
- Categorías con creación, renombrado, reordenamiento y reasignación antes de eliminar.
- Importación CSV con plantilla, vista previa, validación fila por fila y errores bloqueantes.
- Configuración de marca, logo, color, WhatsApp y umbral de stock.
- Command palette con búsqueda server-side, atajos de teclado y navegación.
- Modo demo local con datos ficticios y guardas para producción.
- Esquema de Supabase con RLS, Storage y script de bootstrap del primer admin.
- Tests unitarios con Vitest, E2E con Playwright y workflow de CI.
- Documentación de arquitectura, seguridad, contribución y capturas de referencia.

### Security

- Verificación de sesión y rol en cada Server Action de escritura.
- Validación de entrada con Zod en el servidor.
- Separación de secretos y bloqueo de arranque ante configuración inválida.
- Modo demo desactivado por defecto en producción.
