# Documentación — `@dlunire/front-dlroute`

Enrutamiento de **UI en el navegador**, alineado al backend DLUnire.  
**No es SSR ni despacho HTTP** (eso es [`dlunire/dlroute`](https://github.com/dlunire/dlroute) en el servidor).

### Licencia (MIT desde 2.1.0)

Este paquete pasó de **AGPL-3.0-or-later** a **MIT** para **facilitar la adopción en el cliente** (integración en cualquier UI, incluida propietaria). **No se monetiza** por separado.  
El kernel y el servidor DLUnire **mantienen** su licencia. Histórico: npm **≤ 2.0.2** = AGPL; **≥ 2.1.0** = MIT.  
Ver [README](../README.md#licencia-mit-desde-210) y [LICENSE](../LICENSE).

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
| Licencia | **MIT** (≥ 2.1.0) — ver [LICENSE](../LICENSE) |

> En un checkout del monorepo local también existen `Documentos/ARQUITECTURA-DLUNIRE.md` y el README de la raíz del workspace; no forman parte de este repositorio npm/git.
>
> Versiones npm **≤ 2.0.2** se publicaron como AGPL-3.0-or-later; **2.1.0+** es MIT.

## Contrato de match (recordatorio)

| Patrón | URL | Match |
|--------|-----|-------|
| `/users/:id` | `/users/99` | Sí |
| `/users/:id` | `/posts/99` | **No** |
