# Documentación — `@dlunire/front-dlroute`

Enrutamiento de **UI en el navegador**, alineado al backend DLUnire.  
**No es SSR ni despacho HTTP** (eso es [`dlunire/dlroute`](../../dlroute/docs/README.md) en el servidor).

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

## En el monorepo

- Mapa del workspace: [README del monorepo](../../../../README.md)  
  *(desde `docs/`: `../` = paquete, `../../` = front, `../../../` = Libraries, `../../../../` = my-projects)*  
- Arquitectura: [Documentos/ARQUITECTURA-DLUNIRE.md](../../../../Documentos/ARQUITECTURA-DLUNIRE.md)  
- HTTP servidor (pareja de este paquete): [Libraries/dlroute/docs](../../../dlroute/docs/README.md)

## Contrato de match (recordatorio)

| Patrón | URL | Match |
|--------|-----|-------|
| `/users/:id` | `/users/99` | Sí |
| `/users/:id` | `/posts/99` | **No** |
