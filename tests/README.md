# Baterías de prueba — `@dlunire/front-dlroute`

Prueban la **API pública** desde `dist/`. No modifican `lexer.ts`, `router.ts` ni `base-url.ts`.

## Requisitos

```bash
pnpm run build   # o tsc — dist/ al día
```

## Ejecutar

```bash
cd Libraries/front/parsing

# Todas
node --test tests/*.test.mjs

# Por módulo
node --test tests/lexer.test.mjs
node --test tests/router.test.mjs
node --test tests/base-url.test.mjs
```

O vía npm/pnpm si el script está en `package.json`:

```bash
pnpm test
```

## Archivos

| Archivo | Cubre |
|---------|--------|
| `setup-dom.mjs` | Mock `document` / `location` / `HTMLMetaElement`; silenciar `console.log` |
| `lexer.test.mjs` | Autómata: normalización, Static/Parameter, snapshots, URL absolutas |
| `router.test.mjs` | Registro 0/1, dispatch estático/param, **contrato `/posts/99`**, prioridad |
| `base-url.test.mjs` | `getRoute`, base `/app`, `getBaseURL`, `asset`, meta ausente |

## Contratos acotados (no negociables en CI)

| Patrón registrado | URL (path relativo) | Esperado |
|-------------------|---------------------|----------|
| `/users/:id` | `/users/99` | Match, `param.id = "99"` |
| `/users/:id` | `/posts/99` | **NO match** |
| `/clients/:id/orders/:order` | `/clients/1/orders/2` | Match |
| `/clients/:id/orders/:order` | `/shops/1/orders/2` | **NO match** |
| `/users` (0) y `/users/:id` (1) | `/users` | Estática gana |
| `/users/99` registrado como estática | `/users/99` | Cajón 0, no param |

## Notas

- `dispatch()` depende de `getRoute()` → hace falta meta `dlroute:base-url` (el mock la instala).
- Tutorial de uso: [../docs/TUTORIAL.md](../docs/TUTORIAL.md)
- Suite canónica: `lexer` / `router` / `base-url`.
