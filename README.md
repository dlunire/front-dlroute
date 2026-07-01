# Enrutador para se conectado con DLRoute

Sistema de ruta que se utiliza para conectar con el enrutador de `DLRoute`.

Ejemplo básic de uso:

```ts
route('/ruta/registrada', function () { ... });
```

O para utilizarlo con `SvelteJS`:

```ts
route('/ruta/registrada', component);
``` 

Importante, debe utilizar el despachador, que permite ejecutar el `componente` o la función. 

Si va a utilizar una función haces esto:

```ts
route('/ruta/registrada', function () { ... });

const method: Function = dispatch().component as typeof Function;

method();
```

Y si es para utilizar con Svelte, solo tienes que hacer esto:

```svelte
<script>
route('/ruta/registrada', component);

const component: typeof SvelteComponet | null = dispatch().component as typeof SvelteComponent;
</script>

{#if component }
    <svelte:component this={component} />
{/if}
```

