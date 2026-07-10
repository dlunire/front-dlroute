# Mini-tutorial — `@dlunire/front-dlroute`

Resolver **qué pieza de UI** mostrar según el path del navegador, alineado al backend **DLUnire**.

---

## 1. Qué es (y qué no es)

| Es                                                       | No es                                                 |
| -------------------------------------------------------- | ----------------------------------------------------- |
| Puente **cliente ↔ backend** para el diseño de UI        | Un router HTTP de servidor                            |
| Núcleo **agnóstico de framework** (`component: unknown`) | Un reemplazo de Vue Router / React Router “completo”  |
| Base para que **tú** construyas el acoplamiento a tu UI  | Un motor de **SSR** (eso es `dlunire/dlroute` en PHP) |

```
Navegador (path)  →  front-dlroute (¿qué vista?)  →  tu UI
Servidor HTTP     →  dlunire/dlroute (¿qué handler?)  →  HTML/API/SSR
```

---

## 2. Instalación

```bash
pnpm add @dlunire/front-dlroute
# npm i @dlunire/front-dlroute
```

---

## 3. Meta `dlroute:base-url` (obligatoria para `dispatch` / `getRoute`)

El backend debería inyectarla. En local/demo:

```html
<meta name="dlroute:base-url" content="http://localhost:5173" />
```

App bajo subpath:

```html
<meta name="dlroute:base-url" content="https://midominio.com/app" />
```

Así `https://midominio.com/app/users/10` se resuelve como path de app **`/users/10`**.

---

## 4. Tres llamadas

### Registrar

```ts
import { route, dispatch } from '@dlunire/front-dlroute';

route('/users', UsersView);           // estática → clave 0-/users
route('/users/:id', UserDetailView);  // param    → clave 1-/users/:id
route('/users/99', SpecialView);      // estática exacta (no es param)
```

- Dinámico solo con **`:nombre`**.  
- `'/users/99'` **no** es dinámica: es path fijo.

### Despachar

```ts
function navigate() {
  const result = dispatch();

  if (!result.validated.validated || result.component == null) {
    render(NotFoundView);
    return;
  }

  // Acopla aquí tu framework:
  render(result.component, result.validated.param);
}

navigate();
window.addEventListener('popstate', navigate);
```

### Contrato de match (param)

| Patrón                       | URL                   | ¿Match?             |
| ---------------------------- | --------------------- | ------------------- |
| `/users/:id`                 | `/users/99`           | Sí → `{ id: '99' }` |
| `/users/:id`                 | `/posts/99`           | **No**              |
| `/clients/:id/orders/:order` | `/clients/1/orders/2` | Sí                  |
| `/clients/:id/orders/:order` | `/shops/1/orders/2`   | **No**              |

Las **estáticas** (`0-`) ganan por igualdad total del path **antes** de mirar params.

---

## 5. Acoplar a un framework (idea)

El paquete **no** monta componentes. Tú decides:

```ts
// Ejemplo conceptual (Svelte / Vue / React / vanilla)
const { component, validated } = dispatch();
if (validated.validated) {
  // mount(component, target, { props: validated.param })
}
```

Puedes envolver `route`/`dispatch` en **tu** mini-router acoplado al framework (layouts, guards, transiciones). Este núcleo solo resuelve path → recurso + params.

---

## 6. Lexer (opcional, bajo nivel)

Sin regex: autómata sobre el path.

```ts
import { getURIFromURI, getTokensFromURI, parseRoute } from '@dlunire/front-dlroute';

getURIFromURI('/users//10?x=1'); // "/users/10"
getTokensFromURI('/users/:id');  // Static "users" + Parameter ":id"
parseRoute('/users/:id');        // { uri, type: Parameter, tokens }
```

---

## 7. Demo local

```bash
pnpm dev   # Vite + index.html + sandbox.ts
# Probar: /users/10  → match
#         /posts/99  → 404 de sandbox
```

---

## 8. Pruebas

```bash
pnpm run build
pnpm test
```

Ver `tests/README.md`.

---

## 9. Mapa mental 0 / 1

```
dispatch()
  │
  ├─ ¿existe routes["0-" + uriActual]?  →  FIN (estática)
  │
  └─ por cada routes["1-…"]:
        misma # segmentos
        literales del patrón === URL
        capturar :params
        → primer match  → FIN
        → ninguno       → 404
```

SSR, verbos HTTP, middlewares de API: **servidor (`dlunire/dlroute`)**, no este paquete.
