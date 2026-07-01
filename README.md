# Enrutador para integrarse con DLRoute

Este módulo proporciona el sistema de enrutamiento del cliente diseñado para integrarse con el motor de enrutamiento de **DLRoute**.

Las rutas se registran mediante la función `route`, asociando a cada una de ellas un recurso arbitrario. Dicho recurso puede ser una función, un componente de Svelte o cualquier otro valor, ya que el enrutador no depende de ningún framework en particular.

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

## Despacho de rutas

La resolución de la ruta actual se realiza mediante `dispatch()`, que devuelve el recurso asociado a la ruta coincidente.

### Utilizando funciones

Si el recurso registrado es una función:

```ts
route('/ruta/registrada', function () {
    // ...
});

const method: Function = dispatch().component as typeof Function;

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

De esta forma, el enrutador permanece completamente desacoplado de Svelte. `dispatch()` únicamente resuelve la ruta actual y devuelve el recurso asociado; corresponde a la aplicación decidir cómo utilizar dicho recurso.
