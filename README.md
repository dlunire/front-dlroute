# `@dlunire/front-dlroute` — Tutorial de uso

Motor de enrutamiento del lado del cliente para integrarse con el sistema de rutas de DLUnire.

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

El router necesita saber cuál es la URL base de la aplicación. Esta información la inyecta el **backend automáticamente** en el HTML que sirve, colocando el siguiente meta tag dentro del `<head>`:

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
> Porque si el meta tag lo pusiera el desarrollador manualmente, tendría
> que cambiarlo en cada entorno (local, staging, producción). Al inyectarlo
> el backend, la URL siempre refleja el dominio real desde el que se sirve
> el HTML. Si la URL no coincidiera con la del documento actual, el script
> ni siquiera cargaría, por lo que el valor de `content` siempre será
> correcto en tiempo de ejecución.

---

## Uso básico

### Registrar rutas y despachar

```ts
// src/main.ts
import { route, getBaseURL, getRoute } from '@dlunire/front-dlroute';

// Registrar rutas estáticas
route('/usuarios');
route('/productos');
route('/contacto');

// Registrar rutas con parámetros
route('/usuarios/:id');
route('/productos/:slug');

// Obtener la URL base (leída desde el meta tag)
const base = getBaseURL();
console.log('URL base:', base);
// → "https://servidor.com"

// Obtener la ruta relativa actual
const rutaActual = getRoute();
console.log('Ruta actual:', rutaActual);
// → "/usuarios/123"
```

---

## Funciones exportadas

### `route(uri: string): void`

Registra una ruta en la tabla interna del router. Acepta rutas estáticas y parametrizadas. El lexer clasifica automáticamente cada segmento.

```ts
import { route } from '@dlunire/front-dlroute';

// Ruta estática — todos los segmentos son literales
route('/usuarios');
route('/usuarios/perfil');

// Ruta parametrizada — los segmentos con `:` son dinámicos
route('/usuarios/:id');
route('/usuarios/:id/pedidos');
route('/productos/:categoria/:slug');
```

> Los parámetros se identifican por el prefijo `:`. Un parámetro sin
> nombre (`:` a secas) lanza un error en tiempo de registro.

---

### `getBaseURL(): string`

Devuelve la URL base de la aplicación. Lee el valor del meta tag
`<meta name="dlroute:base-url">` si existe; en caso contrario, usa
la URL actual del navegador (`location.href`) como fallback.

```ts
import { getBaseURL } from '@dlunire/front-dlroute';

const base = getBaseURL();
// Con meta tag:  "https://servidor.com"
// Sin meta tag:  "https://localhost:5173"
```

---

### `getRoute(): string`

Devuelve la ruta relativa actual, calculada como:

```
ROUTE = CURRENT_URI - BASE_URI
```

Es decir, toma la URI canónica de la URL actual del navegador y le
resta el prefijo correspondiente a la URL base registrada en el meta
tag. El resultado es la ruta que el router debe resolver.

```ts
import { getRoute } from '@dlunire/front-dlroute';

// Si la URL actual es: https://servidor.com/usuarios/123
// Y la base es:        https://servidor.com
// Entonces:
const ruta = getRoute();
// → "/usuarios/123"
```

---

## Funciones del analizador léxico (bajo nivel)

Estas funciones forman la base del router. Están disponibles para casos
donde se necesita acceso directo a los tokens o a la URI normalizada.

### `getTokensFromURI(uri: string): Token[]`

Tokeniza una URI y devuelve sus segmentos como un array de tokens.
Cada token incluye su clasificación (`Static` o `Parameter`), el
lexema, la posición y la longitud.

```ts
import { getTokensFromURI } from '@dlunire/front-dlroute';

const tokens = getTokensFromURI('/usuarios/:id/pedidos');
// [
//   { type: 0 /* Static */,    lexeme: 'usuarios', offset: 1, length: 8 },
//   { type: 1 /* Parameter */, lexeme: ':id',      offset: 10, length: 3 },
//   { type: 0 /* Static */,    lexeme: 'pedidos',  offset: 14, length: 7 },
// ]
```

---

### `getURIFromURI(uri: string): string`

Normaliza una URI: colapsa separadores redundantes (`//`), reemplaza
espacios por `_` y descarta el query string.

```ts
import { getURIFromURI } from '@dlunire/front-dlroute';

getURIFromURI('/usuarios//123?token=abc');
// → "/usuarios/123"

getURIFromURI('/pro duc tos///ropa');
// → "/pro_duc_tos/ropa"
```

---

### `getCanonicalURI(): string`

Devuelve la URI canónica construida a partir del último análisis
realizado. Útil cuando se necesita la URI sin volver a tokenizar.

```ts
import { getTokensFromURI, getCanonicalURI } from '@dlunire/front-dlroute';

getTokensFromURI('/usuarios//123/');
getCanonicalURI();
// → "/usuarios/123"
```

---

### `getURLFromURL(stringURL?: string): URL`

Construye un objeto `URL` nativo con el `pathname` normalizado por el
lexer. Compatible con navegador y Node.js.

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

## Ejemplo completo con Vite

```ts
// src/main.ts
import {
    route,
    getBaseURL,
    getRoute,
    getTokensFromURI
} from '@dlunire/front-dlroute';

// 1. Registrar todas las rutas de la aplicación
route('/');
route('/usuarios');
route('/usuarios/:id');
route('/productos');
route('/productos/:slug');

// 2. Leer la URL base inyectada por el backend
const base = getBaseURL();
console.log('Base:', base);

// 3. Resolver la ruta actual
const rutaActual = getRoute();
console.log('Ruta:', rutaActual);

// 4. Tokenizar para matching dinámico
const tokens = getTokensFromURI(rutaActual);
const tieneParametros = tokens.some(t => t.type === 1 /* Parameter */);

if (tieneParametros) {
    console.log('Ruta dinámica detectada');
    tokens
        .filter(t => t.type === 1)
        .forEach(t => {
            // El nombre del parámetro sin el prefijo ":"
            const nombre = t.lexeme.slice(1);
            console.log(`Parámetro: ${nombre}`);
        });
} else {
    console.log('Ruta estática');
}
```

---

## Comportamiento ante URIs "sucias"

El lexer normaliza automáticamente cualquier URI de entrada:

| Entrada | Resultado de `getURIFromURI` |
|---|---|
| `/usuarios//123` | `/usuarios/123` |
| `/usuarios/123?token=abc` | `/usuarios/123` |
| `/pro duc tos` | `/pro_duc_tos` |
| `/usuarios////123///pedidos` | `/usuarios/123/pedidos` |
| `` (vacío) | `/` |

Esto garantiza que el matching de rutas sea siempre determinístico,
independientemente de cómo haya sido construida la URL original.

---

## Notas importantes

- El meta tag `dlroute:base-url` **no debe escribirse a mano en producción**:
  debe ser inyectado por el backend de DLUnire.
- Un parámetro sin nombre (`:` a secas) lanza un `Error` en tiempo de
  registro, no en tiempo de matching.
- El router no es seguro para invocaciones concurrentes en el mismo
  proceso (por ejemplo, dos tokenizaciones simultáneas en workers
  compartidos), ya que el estado del analizador léxico es compartido a
  nivel de módulo.
- Las funciones de alto nivel (`getTokensFromURI`, `getURIFromURI`, etc.)
  devuelven siempre snapshots independientes (`[...tokens]`), por lo que
  los resultados ya obtenidos no se ven afectados por llamadas posteriores.

---

## Repositorio

[github.com/dlunire/front-dlroute](https://github.com/dlunire/front-dlroute)

**Paquete npm:** [`@dlunire/front-dlroute`](https://www.npmjs.com/package/@dlunire/front-dlroute)