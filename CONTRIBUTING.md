# Contribuir

Gracias por tomarte el tiempo de revisar el proyecto. Las contribuciones son bienvenidas siempre que mantengan el foco, la claridad y la calidad del código.

## Requisitos

- Node.js `>=22.13.0` (ver `.nvmrc`).
- npm `>=10`.

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`. Sin variables de Supabase arranca en modo demo con datos ficticios.

## Checks antes de abrir un PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run test:e2e` compila la aplicación y ejecuta Playwright. En CI se usa Chromium.

## Convenciones del proyecto

- **Idioma:** la interfaz y los textos de producto están en español rioplatense.
- **Server Actions:** validar sesión/permisos y datos de entrada con Zod antes de tocar datos.
- **Datos:** mantener la capa de repositorio y sus dos implementaciones (demo y Supabase) en sincronía.
- **Astryx:** se usa como capa selectiva. No migrar componentes existentes sin una razón concreta.
- **Estilos:** priorizar componentes y utilidades de Tailwind respaldadas por tokens. Evitar valores arbitrarios y estilos inline.
- **Secretos:** nunca commitear `.env.local`, claves de servicio ni datos reales.
- **Tests:** agregar o actualizar tests cuando cambie comportamiento observable.

## Commits y PRs

Se recomiendan commits pequeños con Conventional Commits:

```text
feat: agrega filtro por categoría en el catálogo
fix: corrige el cálculo de stock bajo
docs: actualiza la guía de despliegue
```

En el PR incluí:

- Qué cambia y por qué.
- Cómo probarlo.
- Capturas si hay cambios visuales.
- Riesgos o migraciones necesarias.
