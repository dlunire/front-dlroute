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
import { type Dispatch, type RouteType } from "./type.js";
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
export declare function route(uri: string, component: unknown): void;
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
export declare function resetState(): void;
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
export declare function getRoutes(): {
    [x: string]: RouteType;
};
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
export declare function dispatch(): Dispatch;
