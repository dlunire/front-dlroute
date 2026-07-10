# Documentación — `@dlunire/front-dlroute`

Enrutamiento de **UI en el navegador**, alineado al backend DLUnire.  
**No es SSR ni despacho HTTP** (eso es [`dlunire/dlroute`](https://github.com/dlunire/dlroute) en el servidor).

## Empezar aquí

| Documento | Contenido |
|-----------|-----------|
| **[TUTORIAL.md](TUTORIAL.md)** | Mini-tutorial: propósito, meta, `route`/`dispatch`, contrato de match, acoplar framework |
| **[../README.md](../README.md)** | README del paquete (instalación, API, arquitectura) |
| **[../tests/README.md](../tests/README.md)** | Cómo ejecutar la batería de pruebas |

## Código (JSDoc)

| Módulo | Rol |
|--------|-----|
| `lexer.ts` | Autómata de path (sin regex) |
| `router.ts` | `route` / `dispatch` (estáticas `0-`, params `1-`) |
| `base-url.ts` | Meta `dlroute:base-url`, path relativo, `asset` |
| `type.ts` | Tipos y gramática Static / Parameter |

## Ecosistema

| Recurso | Enlace |
|---------|--------|
| HTTP servidor (pareja) | [github.com/dlunire/dlroute](https://github.com/dlunire/dlroute) |
| Organización | [github.com/dlunire](https://github.com/dlunire) |
| npm | [@dlunire/front-dlroute](https://www.npmjs.com/package/@dlunire/front-dlroute) |

> En un checkout del monorepo local también existen `Documentos/ARQUITECTURA-DLUNIRE.md` y el README de la raíz del workspace; no forman parte de este repositorio npm/git.

## Contrato de match (recordatorio)

| Patrón | URL | Match |
|--------|-----|-------|
| `/users/:id` | `/users/99` | Sí |
| `/users/:id` | `/posts/99` | **No** |
