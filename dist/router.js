/**
 * DLUnire — @dlunire/front-dlroute
 * Copyright (C) 2026 David E Luna M
 *
 * Operando bajo el establecimiento de comercio "DLUnire",
 * NIT 700551569-1, matrícula mercantil Nº 10007069
 * (matrícula mercantil personal Nº 10007068).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */
/**
 * @packageDocumentation
 *
 * Despacho de rutas en el **navegador** para UI sobre el ecosistema DLUnire.
 *
 * Este módulo **no** sustituye el enrutamiento HTTP del servidor (`dlunire/dlroute`).
 * Su propósito es resolver *qué recurso de interfaz* corresponde al path actual,
 * de forma agnóstica al framework: el consumidor acopla Svelte, Vue, React, vanilla
 * o su propio router de presentación encima de {@link route} / {@link dispatch}.
 *
 * Flujo:
 * 1. {@link route} — registra path canónico + recurso (`component: unknown`).
 * 2. {@link dispatch} — lee la ruta relativa vía `getRoute()` (meta `dlroute:base-url`)
 *    y devuelve componente + parámetros capturados.
 *
 * @see {@link route}
 * @see {@link dispatch}
 */
import * as parsing from "./lexer.js";
import * as routing from "./base-url.js";
import { TokenType } from "./type.js";
/**
 * Tabla interna de rutas registradas.
 *
 * Clave: `` `${TokenType}-${uriCanónica}` ``
 * - `0-/users` — ruta **estática** (ningún segmento `:param`)
 * - `1-/users/:id` — ruta **parametrizada** (al menos un `:param`)
 *
 * Las claves se generan con la URI canónica del lexer (`parseRoute`), no con
 * el string crudo pasado a {@link route}.
 */
const routes = {};
/**
 * Registra una ruta y el recurso de UI asociado.
 *
 * - Sin segmentos `:nombre` → tipo estático (`0-…`); match por igualdad total del path.
 * - Con al menos un `:nombre` → tipo param (`1-…`); match estructural en {@link dispatch}.
 * - `route('/users/99', fn)` es **estática** (el número no es dinámico; solo `:` marca param).
 *
 * @param uri - Plantilla de path (p. ej. `/users`, `/users/:id`). Se normaliza (`//`, espacios, etc.).
 * @param component - Recurso de UI (`unknown`): componente, función, módulo lazy, etc.
 *                    El núcleo no renderiza; solo lo devuelve en {@link dispatch}.
 *
 * @throws {Error} Si la plantilla incluye un parámetro sin nombre (`:` a secas).
 *
 * @example
 * route('/users', UsersView);
 * route('/users/:id', UserDetailView);
 * route('/users/99', SpecialUserView); // estática exacta, no es param
 */
export function route(uri, component) {
    const route = parsing.parseRoute(uri);
    // `unknown` a propósito: el acoplamiento al framework lo define quien implementa la UI.
    route.component = component;
    routes[`${route.type}-${route.uri}`] = route;
}
/**
 * Elimina todas las rutas registradas del despachador.
 *
 * Vacía por completo la tabla interna utilizada durante el proceso de
 * resolución de rutas, dejando el router en el mismo estado que tendría
 * inmediatamente después de cargarse el módulo, antes de registrar
 * cualquier ruta mediante {@link route}.
 *
 * @remarks
 * Esta operación elimina tanto las rutas estáticas como las
 * parametrizadas, junto con los recursos asociados a cada una de ellas.
 * Resulta útil en escenarios donde el conjunto de rutas debe
 * reconstruirse completamente, como durante pruebas, recargas en
 * caliente (Hot Module Replacement) o procesos de inicialización del
 * router.
 *
 * La limpieza se realiza sobre el mismo objeto interno, eliminando cada
 * una de sus entradas mediante `delete`, en lugar de reemplazar la
 * referencia por un nuevo objeto. De este modo, cualquier referencia
 * existente a {@link getRoutes} continúa apuntando a la misma instancia,
 * observando el estado actualizado del registro.
 *
 * @example
 * route('/users', UsersComponent);
 * route('/posts/:id', PostComponent);
 *
 * resetState();
 *
 * getRoutes(); // → {}
 */
export function resetState() {
    for (const index in routes) {
        delete routes[index];
    }
}
/**
 * Obtiene el registro interno de rutas del router.
 *
 * Devuelve la tabla que contiene todas las rutas registradas mediante
 * {@link route}, indexadas por su clave canónica (`<tipo>-<uri>`). Cada
 * entrada almacena la representación estructurada de la ruta y el
 * recurso asociado a ella.
 *
 * @returns La tabla interna de rutas registradas.
 *
 * @remarks
 * Esta función expone la misma instancia utilizada internamente por el
 * router; no crea una copia del registro. En consecuencia, cualquier
 * modificación realizada sobre el objeto devuelto afectará
 * directamente al estado interno del despachador.
 *
 * Está pensada principalmente para tareas de inspección, depuración,
 * pruebas automatizadas o herramientas de desarrollo que necesiten
 * consultar el conjunto de rutas registradas.
 *
 * @example
 * route('/users', UsersComponent);
 * route('/users/:id', UserDetailComponent);
 *
 * const routes = getRoutes();
 *
 * console.log(Object.keys(routes));
 * // → ['0-/users', '1-/users/:id']
 */
export function getRoutes() {
    return routes;
}
/**
 * Resuelve el path **relativo actual** (vía {@link routing.getRoute}) y
 * devuelve el recurso de UI registrado y los parámetros capturados.
 *
 * **No es SSR ni despacho HTTP.** Eso lo hace `dlunire/dlroute` en el servidor.
 * Aquí solo se elige *qué pieza de interfaz* corresponde al path del navegador.
 *
 * Orden de resolución:
 * 1. **Cajón estático (`0-`):** lookup `routes['0-' + uri]` — igualdad total del path, O(1).
 * 2. **Cajón param (`1-`):** recorre rutas parametrizadas; {@link getValidateRoute}
 *    exige misma aridad, literales del patrón iguales y captura de `:params`.
 *
 * Contrato (literales del patrón):
 * - `/users/:id` + URL `/users/99` → match, `{ id: '99' }`
 * - `/users/:id` + URL `/posts/99` → **no** match
 *
 * @returns {@link Dispatch}: `validated` + `component` (o `component: null` si 404).
 *
 * @remarks
 * Requiere meta `dlroute:base-url` en el documento (la usa `getRoute`).
 * No renderiza: la capa de UI decide qué hacer con `component` y `param`.
 *
 * @example
 * const result = dispatch();
 * if (result.validated.validated) {
 *     mount(result.component, result.validated.param);
 * } else {
 *     mount(NotFoundView);
 * }
 */
export function dispatch() {
    /** Ruta actual capturada */
    const route = routing.getRoute();
    const { uri, tokens: currentTokens } = route;
    /** Información adicional de rutas validadas */
    let validatedRoute = null;
    /** Ruta registrada que coincide con la URI canónica estática */
    const matchedRoute = routes[`0-${uri}`] ?? null;
    if (matchedRoute) {
        return {
            validated: {
                param: {},
                uri: `0-${matchedRoute.uri}`,
                validated: true
            },
            component: matchedRoute.component
        };
    }
    for (const route in routes) {
        if (route[0] === `${TokenType.Static}`)
            continue;
        validatedRoute = getValidateRoute(route, currentTokens);
        if (validatedRoute.validated)
            break;
    }
    if (validatedRoute && validatedRoute.uri) {
        return {
            validated: validatedRoute,
            component: routes[validatedRoute.uri].component
        };
    }
    return {
        validated: {
            param: {},
            uri: null,
            validated: false
        },
        component: null
    };
}
/**
 * Comprueba si un **patrón parametrizado** registrado coincide con el path actual.
 *
 * Solo se invoca desde {@link dispatch} para claves `1-…`. Las rutas estáticas
 * (`0-…`) ya se resolvieron por lookup exacto y **no** pasan por aquí.
 *
 * @param uri - Clave de tabla (`1-/users/:id`), no el path del navegador.
 * @param tokens - Tokens del **path actual** (URL visitada), ya tokenizados.
 *
 * @returns {@link ValidatedRoute}:
 * - match → `validated: true`, `uri` = clave, `param` = valores capturados;
 * - no match → `validated: false`, `uri: null`, `param: {}`.
 *
 * @remarks
 * Convención de variables en el bucle (fácil de malinterpretar):
 * - `tokens` / `token` → segmentos de la **URL actual**
 * - `currentTokens` / `currentToken` → segmentos del **patrón registrado**
 *   (se re-tokeniza `uri.substring(2)`, p. ej. `/users/:id`)
 *
 * Criterios de match (todos obligatorios):
 * 1. Misma cantidad de segmentos.
 * 2. En cada posición, si el patrón es {@link TokenType.Static}, el lexema
 *    de la URL debe ser **idéntico** (p. ej. `users` ≠ `posts` → no match).
 * 3. Si el patrón es {@link TokenType.Parameter}, se captura
 *    `param[nombreSinDosPuntos] = lexemaDeLaURL`.
 *
 * El lookup estático de `dispatch` **no** valida los literales internos de un
 * patrón `1-…`; esa validación ocurre **aquí**.
 *
 * @example
 * // patrón 1-/users/:id, URL /users/99  → match, { id: '99' }
 * // patrón 1-/users/:id, URL /posts/99 → no match
 */
function getValidateRoute(uri, tokens) {
    /** Tokens del patrón registrado (plantilla), no de la URL. */
    const currentTokens = parsing.getTokensFromURI(uri.substring(2));
    const { length: currentLength } = currentTokens;
    const { length } = tokens;
    const param = {};
    if (length !== currentLength)
        return {
            param,
            uri: null,
            validated: false
        };
    for (const index in tokens) {
        /** Segmento de la URL visitada. */
        const token = tokens[index];
        /** Segmento del patrón registrado. */
        const currentToken = currentTokens[index];
        const currentLexeme = currentToken.lexeme.substring(1);
        const lexeme = token.lexeme;
        if (currentToken.type === TokenType.Static && currentToken.lexeme !== lexeme) {
            return {
                param: {},
                uri: null,
                validated: false
            };
        }
        ;
        if (currentToken.type !== TokenType.Parameter)
            continue;
        param[currentLexeme] = lexeme;
    }
    return {
        param,
        uri,
        validated: true
    };
}
