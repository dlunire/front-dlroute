# `@dlunire/front-dlroute`

**Resolución de rutas en el navegador para UI**, alineada al backend [DLUnire](https://github.com/dlunire).

> No es un router HTTP de servidor ni un motor de SSR.  
> **SSR y despacho HTTP → `dlunire/dlroute` (PHP).**  
> **Path del navegador → vista/recurso de UI → este paquete.**

La mayoría de routers van **acoplados a un framework**. Este se diseñó al revés: núcleo **agnóstico** (`component: unknown`) para que **tú** (o tu equipo) construyáis el acoplamiento a Svelte, Vue, React, vanilla o un router de presentación propio.

---

## Documentación

| Enlace | Contenido |
|--------|-----------|
| **[docs/TUTORIAL.md](docs/TUTORIAL.md)** | Mini-tutorial (recomendado) |
| **[docs/README.md](docs/README.md)** | Índice de docs del paquete |
| **[tests/README.md](tests/README.md)** | Batería de pruebas |
| [dlunire/dlroute](https://github.com/dlunire/dlroute) | Pareja HTTP en servidor (no SSR aquí) |
| [Org DLUnire](https://github.com/dlunire) | Ecosistema y demás paquetes |

Resumen en 30 segundos:

```ts
import { route, dispatch } from '@dlunire/front-dlroute';

route('/users', UsersView);
route('/users/:id', UserDetailView);

const { component, validated } = dispatch();
if (validated.validated) {
  // monta `component` con validated.param en TU framework
} else {
  // 404 de UI
}
```

HTML (el backend debería inyectar el meta):

```html
<meta name="dlroute:base-url" content="https://tu-servidor.com" />
```

**Contrato de match:** `/users/:id` coincide con `/users/99`, **no** con `/posts/99`.

---

## Instalación

```bash
pnpm add @dlunire/front-dlroute
# npm install @dlunire/front-dlroute
```

- Node 18+ / bundler ESM (Vite, etc.)
- Licencia **AGPL-3.0-or-later** (ecosistema dual DLUnire)

---

## API esencial

| Función | Rol |
|---------|-----|
| `route(uri, component)` | Registra path (estático o `:param`) + recurso UI |
| `dispatch()` | Path actual → `{ component, validated }` |
| `getRoute()` | URI relativa + tokens (usa el meta) |
| `getBaseURL()` / `asset(uri)` | Base de la app y URLs de assets |
| `resetState()` / `getRoutes()` | Limpiar / inspeccionar tabla |
| `getTokensFromURI` / `parseRoute` / … | Lexer (bajo nivel) |

### Estática vs param

| Registro | Tipo | Clave |
|----------|------|--------|
| `route('/users', …)` | Estática | `0-/users` |
| `route('/users/:id', …)` | Param | `1-/users/:id` |
| `route('/users/99', …)` | **Estática** (path fijo) | `0-/users/99` |

Las estáticas se resuelven por **igualdad total** del path (prioridad).  
Los params exigen **mismos segmentos literales** + captura de `:nombre`.

---

## Arquitectura (una figura)

```
┌─────────────────────────────────────────┐
│  Backend DLUnire (dlroute PHP)          │
│  · HTTP, SSR si aplica, meta base-url   │
└─────────────────┬───────────────────────┘
                  │ HTML + <meta dlroute:base-url>
                  ▼
┌─────────────────────────────────────────┐
│  @dlunire/front-dlroute                 │
│  · Lexer de path (sin regex)            │
│  · route / dispatch                     │
└─────────────────┬───────────────────────┘
                  │ component + param
                  ▼
┌─────────────────────────────────────────┐
│  Tu capa de UI / router acoplado        │
│  Svelte · Vue · React · vanilla · …     │
└─────────────────────────────────────────┘
```

---

## Gramática de path (cliente)

- Separador de segmentos: `/`
- Parámetro: segmento que empieza por `:` y tiene nombre (`:id`)
- `:` solo → error al registrar/tokenizar
- Query `?…` no forma parte del path de match
- `//` se colapsa; espacios en un segmento → `_`

> En PHP las plantillas suelen usar `{id}`. Aquí la UI usa **`:id`**. Misma *idea* de enrutamiento; sintaxis de plantilla distinta.

---

## Demo y tests

```bash
pnpm dev          # sandbox en Vite (index.html + sandbox.ts)
pnpm run build
pnpm test         # node --test tests/*.test.mjs
```

Documentación de la batería: [tests/README.md](tests/README.md).

---

## Enlaces

- Tutorial: [docs/TUTORIAL.md](docs/TUTORIAL.md)
- npm: [`@dlunire/front-dlroute`](https://www.npmjs.com/package/@dlunire/front-dlroute)
- Org: [github.com/dlunire](https://github.com/dlunire)

---

*DLUnire — unidades que se conectan. El servidor enruta HTTP; el cliente enruta UI.*
