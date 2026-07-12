# front-dlroute

**Motor de rutas para interfaces de usuario.** Asocia una URI a un
recurso arbitrario —un componente, una función, o cualquier otro
valor— y resuelve cuál corresponde a la ruta actual del navegador.

No depende de ningún framework de presentación (funciona igual con
Svelte, Vue, React, o TypeScript sin ningún framework) ni de ningún
backend en particular (Go, Rust, C#, PHP, DLUnire, o ninguno). Resuelve
exactamente un problema —URI → recurso— y nada más: qué framework
renderiza el resultado, qué backend sirve las rutas HTTP reales, y cómo
se dispara la navegación son decisiones de quien lo usa, no del router.

> Nació de una necesidad concreta: un router de frontend que funcionara
> con backends no-Node (PHP, Rust, o cualquier otro) sin forzar a
> introducir Node en el stack solo para satisfacer el router.
>
> Se originó dentro del ecosistema DLUnire, pero no depende de él.
> Cualquier proyecto —con o sin DLUnire como backend— puede usarlo igual.

## Instalación

```bash
npm install @dlunire/front-dlroute
```

```bash
pnpm add @dlunire/front-dlroute
```

## Requisito: URL base

El router necesita conocer la URL base de la aplicación (útil cuando la
app se sirve bajo un subpath, ej. `/app/...`). Se declara con una meta
etiqueta en el HTML:

```html
<meta name="dlroute:base-url" content="https://ejemplo.com/app">
```

Sin esta etiqueta, `dispatch()` lanza un error. Quién la genera no le
importa al router: puede ser una plantilla de cualquier backend, o un
HTML estático escrito a mano.

## Registro de una ruta

Ejemplo básico:

```ts
route('/ruta/registrada', function () {
    // ...
});
```

Con **Svelte**, basta con asociar el componente correspondiente:

```ts
route('/ruta/registrada', Component);
```

**Parámetros dinámicos:** usa `:nombreDelParametro` para marcar segmentos
dinámicos. El router va a capturar cualquier valor en ese segmento:

```ts
route('/users/:id', UserComponent);
route('/posts/:id/comments/:commentId', CommentComponent);
```

> Nota: si estás usando un backend en PHP con `dlunire/dlroute`, allí los
> parámetros de plantilla usan `{id}` en lugar de `:id`. Ambos resuelven
> lo mismo (un segmento dinámico), pero la sintaxis es distinta en cada
> capa.

## Despacho de rutas

La resolución de la ruta actual se realiza mediante `dispatch()`, que
devuelve el recurso asociado a la ruta coincidente.

### Utilizando funciones

Si el recurso registrado es una función:

```ts
route('/ruta/registrada', function () {
    // ...
});

const method: Function = dispatch().component as typeof Function | null;

method();
```

### Utilizando Svelte

Si el recurso registrado es un componente de Svelte:

```svelte
<script lang="ts">
    route('/ruta/registrada', Component);

    const component =
        dispatch().component as typeof SvelteComponent | null;
</script>

{#if component}
    <svelte:component this={component} />
{/if}
```

De esta forma, el enrutador permanece completamente desacoplado de
Svelte —y, por el mismo principio, de cualquier otro framework.
`dispatch()` únicamente resuelve la ruta actual y devuelve el recurso
asociado; corresponde a la aplicación decidir cómo utilizar dicho
recurso.

## Trabajar con URLs de recursos estáticos

Si necesitás construir URLs para recursos estáticos (CSS, imágenes, etc.)
respetando la base URL de la aplicación, usa `asset()`:

```ts
import { asset } from "@dlunire/front-dlroute";

const logoUrl = asset("/img/logo.png");
// → "https://ejemplo.com/app/img/logo.png" (según la meta `dlroute:base-url`)
```

Esto es útil cuando la app se sirve bajo un subpath y no querés hardcodear
las rutas.

## Por qué existe

**Las alternativas de enrutamiento de frontend suelen caer en dos
categorías:**

- Ligadas a un framework específico u orientadas a Server-Side Rendering (SSR) —lo cual solo tiene sentido si el backend corre en el mismo runtime que el router (típicamente Node).
- Si el backend es DLUnire, PHP, Go, Rust, C# o cualquier otro stack **no-JS**, ninguna de las dos encaja sin forzar una pieza de infraestructura que el proyecto no necesita.

`front-dlroute` existe para el caso donde el backend ya resuelve sus
propias rutas HTTP, en el lenguaje que sea, y el frontend solo necesita
decidir qué recurso corresponde al path actual —sin arrastrar un
framework de presentación ni una arquitectura de SSR que no aplica.