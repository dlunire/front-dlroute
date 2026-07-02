# `@dlunire/front-dlroute` — Tutorial de uso

Motor de enrutamiento del lado del cliente para integrarse con el sistema
de rutas de DLUnire. Compatible con cualquier framework de interfaz de
usuario (Svelte, Vue, React, Vanilla JS, etc.).

---

## Requisitos previos

- Node.js 18+
- Vite (o cualquier bundler compatible con ESM)
- El backend debe inyectar el meta tag de URL base en el HTML servido

---

## Instalación

```bash
# npm
npm install @dlunire/front-dlroute

# pnpm
pnpm add @dlunire/front-dlroute

# yarn
yarn add @dlunire/front-dlroute
```

---

## Configuración del HTML

El router necesita saber cuál es la URL base de la aplicación. Esta
información la inyecta el **backend automáticamente** en el HTML que
sirve, colocando el siguiente meta tag dentro del `<head>`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!--
        Este meta tag lo inyecta el backend de DLUnire.
        No lo escribas a mano en producción: el valor de `content`
        debe reflejar la URL base real desde donde se sirve la app.
    -->
    <meta name="dlroute:base-url" content="https://servidor.com" />

    <title>Mi aplicación</title>
    <script type="module" src="/src/main.ts"></script>
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

> **¿Por qué lo inyecta el backend?**
> Porque si la URL base no coincidiera con el dominio real desde el que
> se sirve el documento, el script ni siquiera cargaría. Eso garantiza
> que el valor de `content` sea siempre correcto en tiempo de ejecución,
> sin importar el entorno (local, staging, producción).

---

## Uso básico

### 1. Registrar rutas

Cada ruta se registra con `route(uri, component)`, donde `component`
puede ser un componente, un controlador, una función o cualquier recurso
que tu aplicación necesite renderizar cuando esa ruta sea activada.

```ts
// src/main.ts
import { route, dispatch } from '@dlunire/front-dlroute';

// Rutas estáticas
route('/usuarios', UsuariosVista);
route('/usuarios/perfil', PerfilVista);
route('/contacto', ContactoVista);

// Rutas parametrizadas
route('/usuarios/:id', UsuarioDetalleVista);
route('/clientes/:id/pedidos/:pedido', PedidoDetalleVista);
```

### 2. Despachar la ruta actual

```ts
const resultado = dispatch();

if (resultado.validated.validated) {
    // Ruta encontrada: renderizar el componente asociado
    renderizar(resultado.component, resultado.validated.param);
} else {
    // Ninguna ruta coincidió: mostrar vista 404
    renderizar(Vista404);
}
```

---

## API completa

### `route(uri, component): void`

Registra una ruta en la tabla interna del router junto con el recurso
asociado. El analizador léxico clasifica automáticamente cada segmento
como estático o parametrizado.

```ts
import { route } from '@dlunire/front-dlroute';

// Con función anónima
route('/usuarios', () => {
    console.log('cargando vista de usuarios');
});

// Con función con nombre
route('/contacto', vistaContacto);

// Con componente (Svelte, Vue, React, etc.)
import UsuarioDetalle from './vistas/UsuarioDetalle.svelte';
route('/usuarios/:id', UsuarioDetalle);

// Con módulo cargado dinámicamente
route('/admin', () => import('./vistas/Admin.js'));

// Rutas parametrizadas anidadas
route('/clientes/:id/pedidos/:pedido', PedidoDetalle);
```

El segundo parámetro se declara como `unknown` internamente para que el
router no quede acoplado a ningún framework específico. El consumidor
decide qué tipo de recurso asocia a cada ruta.

> Un parámetro sin nombre (`:` a secas) lanza un `Error` en tiempo de
> registro, no en tiempo de despacho.

---

### `dispatch(): Dispatch`

Resuelve la ruta actual y devuelve el componente asociado junto con los
parámetros capturados.

El proceso de resolución ocurre en dos etapas con prioridades distintas:

1. **Rutas estáticas primero:** búsqueda directa `O(1)` sobre la tabla
   interna. Si la URI actual coincide exactamente con una ruta estática
   registrada, se devuelve inmediatamente sin recorrer las parametrizadas.
2. **Rutas parametrizadas si no hay coincidencia estática:** se recorren
   comparando token por token, extrayendo los valores de los parámetros
   en los segmentos marcados con `:`.

```ts
import { route, dispatch } from '@dlunire/front-dlroute';

route('/usuarios', UsuariosVista);
route('/usuarios/:id', UsuarioDetalleVista);
route('/clientes/:id/pedidos/:pedido', PedidoDetalleVista);

const resultado = dispatch();

// resultado tiene la forma:
// {
//     validated: {
//         validated: boolean,
//         uri: string | null,       // clave canónica de la ruta coincidente
//         param: { [key: string]: string }  // parámetros capturados
//     },
//     component: unknown | null     // recurso asociado a la ruta
// }
```

**Ejemplo con ruta estática** (`/usuarios`):

```ts
// URL actual: https://servidor.com/usuarios
const resultado = dispatch();
// {
//     validated: { validated: true, uri: '0-/usuarios', param: {} },
//     component: UsuariosVista
// }
```

**Ejemplo con ruta parametrizada** (`/usuarios/:id`):

```ts
// URL actual: https://servidor.com/usuarios/123
const resultado = dispatch();
// {
//     validated: {
//         validated: true,
//         uri: '1-/usuarios/:id',
//         param: { id: '123' }
//     },
//     component: UsuarioDetalleVista
// }
```

**Ejemplo con múltiples parámetros** (`/clientes/:id/pedidos/:pedido`):

```ts
// URL actual: https://servidor.com/clientes/42/pedidos/100
const resultado = dispatch();
// {
//     validated: {
//         validated: true,
//         uri: '1-/clientes/:id/pedidos/:pedido',
//         param: { id: '42', pedido: '100' }
//     },
//     component: PedidoDetalleVista
// }
```

**Sin coincidencia (404)**:

```ts
// URL actual: https://servidor.com/ruta-inexistente
const resultado = dispatch();
// {
//     validated: { validated: false, uri: null, param: {} },
//     component: null
// }
```

---

### `resetState(): void`

Elimina todas las rutas registradas y deja el router en su estado
inicial. Útil en pruebas, Hot Module Replacement o cuando el conjunto
de rutas necesita reconstruirse completamente.

```ts
import { route, resetState, getRoutes } from '@dlunire/front-dlroute';

route('/usuarios', UsuariosVista);
route('/productos', ProductosVista);

resetState();

console.log(getRoutes()); // → {}
```

---

### `getRoutes(): object`

Devuelve la tabla interna de rutas registradas, indexadas por su clave
canónica (`<tipo>-<uri>`). Pensada para depuración, inspección o
herramientas de desarrollo.

```ts
import { route, getRoutes } from '@dlunire/front-dlroute';

route('/usuarios', UsuariosVista);
route('/usuarios/:id', UsuarioDetalleVista);

console.log(Object.keys(getRoutes()));
// → ['0-/usuarios', '1-/usuarios/:id']
//      ^                ^
//      tipo 0 = Static  tipo 1 = Parameter
```

> Esta función expone la misma instancia interna del router, no una
> copia. Modificar el objeto devuelto afecta directamente al estado del
> despachador.

---

## Funciones del analizador léxico (bajo nivel)

### `getTokensFromURI(uri): Token[]`

Tokeniza una URI y devuelve sus segmentos clasificados. Cada token
incluye tipo (`0` = Static, `1` = Parameter), lexema, posición y longitud.

```ts
import { getTokensFromURI } from '@dlunire/front-dlroute';

const tokens = getTokensFromURI('/usuarios/:id/pedidos');
// [
//   { type: 0, lexeme: 'usuarios', offset: 1,  length: 8 },
//   { type: 1, lexeme: ':id',      offset: 10, length: 3 },
//   { type: 0, lexeme: 'pedidos',  offset: 14, length: 7 },
// ]
```

---

### `getURIFromURI(uri): string`

Normaliza una URI: colapsa separadores redundantes, reemplaza espacios
por `_` y descarta el query string.

```ts
import { getURIFromURI } from '@dlunire/front-dlroute';

getURIFromURI('/usuarios//123?token=abc'); // → "/usuarios/123"
getURIFromURI('/pro duc tos///ropa');      // → "/pro_duc_tos/ropa"
```

---

### `getURLFromURL(stringURL?): URL`

Construye un objeto `URL` nativo con el `pathname` normalizado. Compatible
con navegador y Node.js.

```ts
import { getURLFromURL } from '@dlunire/front-dlroute';

const url = getURLFromURL('https://servidor.com//usuarios//123?token=abc');
console.log(url.href);
// → "https://servidor.com/usuarios/123"

// Sin argumento: usa location.href (navegador)
// o https://dlunire.dev como fallback (Node.js/SSR)
const urlActual = getURLFromURL();
```

---

## Ejemplo completo con Vite + Vanilla TS

```ts
// src/main.ts
import { route, dispatch, resetState } from '@dlunire/front-dlroute';

// Vistas (pueden ser cualquier cosa: componentes, clases, funciones)
import InicioVista      from './vistas/Inicio.js';
import UsuariosVista    from './vistas/Usuarios.js';
import UsuarioDetalle   from './vistas/UsuarioDetalle.js';
import PedidoDetalle    from './vistas/PedidoDetalle.js';
import Vista404         from './vistas/404.js';

// Registrar rutas
route('/',                              InicioVista);
route('/usuarios',                      UsuariosVista);
route('/usuarios/:id',                  UsuarioDetalle);
route('/clientes/:id/pedidos/:pedido',  PedidoDetalle);

// Resolver la ruta actual
function navegar(): void {
    const resultado = dispatch();

    if (!resultado.validated.validated || resultado.component === null) {
        renderizar(Vista404, {});
        return;
    }

    renderizar(resultado.component, resultado.validated.param);
}

function renderizar(componente: unknown, params: object): void {
    const app = document.getElementById('app')!;
    // Aquí integras con tu framework o estrategia de renderizado
    console.log('Componente:', componente);
    console.log('Parámetros:', params);
}

// Navegar al cargar
navegar();

// Navegar en cada cambio de historial
window.addEventListener('popstate', navegar);
```

---

## Comportamiento ante URIs "sucias"

El lexer normaliza automáticamente cualquier URI de entrada antes de
hacer matching:

| Entrada                      | URI canónica            |
| ---------------------------- | ----------------------- |
| `/usuarios//123`             | `/usuarios/123`         |
| `/usuarios/123?token=abc`    | `/usuarios/123`         |
| `/pro duc tos`               | `/pro_duc_tos`          |
| `/usuarios////123///pedidos` | `/usuarios/123/pedidos` |
| `` (vacío)                   | `/`                     |

Esto garantiza que el matching sea siempre determinístico,
independientemente de cómo haya sido construida la URL original.

---

## Notas importantes

- El meta tag `dlroute:base-url` **lo inyecta el backend de DLUnire**,
  no el desarrollador manualmente.
- Las **rutas estáticas tienen prioridad** sobre las parametrizadas y
  se resuelven en `O(1)` mediante lookup directo.
- Un **parámetro sin nombre** (`:` a secas) lanza un `Error` en tiempo
  de registro, no en tiempo de despacho.
- `component` se declara como `unknown` para que el router sea
  **agnóstico de framework**: funciona igual con Svelte, Vue, React o
  Vanilla JS.
- `getRoutes()` expone la instancia interna, no una copia. Para
  inspeción y debugging únicamente.

---

## Repositorio y paquete

- **GitHub:** [github.com/dlunire/front-dlroute](https://github.com/dlunire/front-dlroute)
- **npm:** [`@dlunire/front-dlroute`](https://www.npmjs.com/package/@dlunire/front-dlroute)