# Política de seguridad

## Versiones soportadas

La rama `main` recibe correcciones de seguridad. Si el proyecto se despliega en producción, se recomienda fijar una versión o un commit y revisar las actualizaciones de dependencias.

## Cómo reportar una vulnerabilidad

No abras un issue público con detalles explotables. Usá **GitHub Security Advisories** desde la pestaña **Security** del repositorio:

1. Entrá en `Security` → `Advisories`.
2. Creá un borrador privado con una descripción, impacto y pasos de reproducción.
3. Si es posible, incluí una prueba de concepto mínima y la versión afectada.

También podés contactar al mantenedor por GitHub: [@luchonicolini](https://github.com/luchonicolini).

## Alcance

Se consideran relevantes, entre otros:

- Bypass de autenticación o autorización en `/admin`.
- Fallas de aislamiento entre usuarios o de Row Level Security en Supabase.
- Ejecución de acciones sin validación de sesión o de permisos.
- Exposición de `SUPABASE_SERVICE_ROLE_KEY`, secretos o datos personales.
- Inyección, XSS, SSRF o path traversal en cargas de archivos.
- Debilidades en el modo demo que permitan saltarse sus límites.

## Manejo de secretos

- `.env.local` y cualquier archivo con credenciales reales están fuera del repositorio.
- `SUPABASE_SERVICE_ROLE_KEY` es exclusivamente server-side y nunca debe llevar el prefijo `NEXT_PUBLIC_`.
- El modo demo usa datos ficticios. No cargues datos reales de clientes en una demo pública.
- Si detectás una clave expuesta, rotala en Supabase y avisá de inmediato.

## Buenas prácticas para despliegues

- Configurá `DEMO_MODE=false` en producción y usá credenciales propias de Supabase.
- Aplicá las políticas RLS incluidas en `supabase/schema.sql`.
- Restringí el acceso al panel y revisá los logs de autenticación.
- Mantené Next.js, Supabase y las dependencias actualizadas.
