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
 * Registra una nueva ruta dentro de la tabla interna del router.
 *
 * La ruta es analizada previamente por el parser para obtener su
 * representación canónica, determinar si es estática o
 * parametrizada, y generar la información estructurada que utilizará
 * el despachador durante la resolución de rutas.
 *
 * Una vez procesada, se asocia el recurso suministrado mediante
 * `component` y la ruta queda indexada utilizando una clave compuesta
 * por su tipo y su URI canónica (`<tipo>-<uri>`), permitiendo una
 * búsqueda eficiente durante el despacho.
 *
 * @param uri - Ruta a registrar dentro del router. Puede contener
 *              segmentos estáticos y parametrizados conforme a la
 *              gramática del lenguaje de rutas de DLRoute.
 *
 * @param component - Recurso asociado a la ruta registrada. Se declara
 *                    como `unknown` para mantener el núcleo del router
 *                    independiente de cualquier framework o biblioteca
 *                    de interfaz de usuario. El consumidor puede
 *                    asociar componentes, funciones, objetos, módulos
 *                    cargados dinámicamente o cualquier otra
 *                    representación que considere apropiada.
 *
 * @remarks
 * Esta función forma parte de la fase de construcción del router y no
 * participa en la resolución de rutas. Su única responsabilidad es
 * registrar rutas ya analizadas dentro de la tabla interna utilizada
 * posteriormente por {@link dispatch}.
 *
 * La representación almacenada proviene exclusivamente de
 * {@link parsing.parseRoute}, garantizando que todas las rutas
 * registradas compartan la misma semántica de normalización empleada
 * durante el despacho.
 *
 * @example
 * route('/users', UsersComponent);
 * route('/users/:id', UserDetailComponent);
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
 * Resuelve la ruta correspondiente a la URL actual y devuelve el
 * recurso asociado a ella.
 *
 * El despachador constituye el núcleo del sistema de enrutamiento del
 * cliente. A partir de la ruta actual obtenida mediante
 * {@link routing.getRoute}, determina cuál de las rutas previamente
 * registradas representa la mejor coincidencia y devuelve tanto la
 * información de validación como el recurso asociado.
 *
 * El proceso de resolución se realiza en dos etapas:
 *
 * 1. Se intenta localizar una coincidencia exacta entre las rutas
 *    estáticas mediante una búsqueda directa sobre la tabla interna.
 * 2. Si no existe una coincidencia estática, se recorren únicamente las
 *    rutas parametrizadas para determinar si alguna coincide con la
 *    estructura de la ruta actual y extraer los valores de sus
 *    parámetros.
 *
 * Si ninguna ruta coincide, la función devuelve un resultado no
 * validado y un recurso nulo (`component = null`), permitiendo que la
 * capa superior decida cómo gestionar la navegación (por ejemplo,
 * mostrando una vista 404).
 *
 * @returns Información del resultado del despacho. Cuando la resolución
 *          tiene éxito, el objeto contiene:
 *
 * - `validated`: información sobre la ruta coincidente y los parámetros
 *   extraídos.
 * - `component`: recurso asociado a la ruta registrada.
 *
 * Si no existe ninguna coincidencia, `validated.validated` será
 * `false`, `validated.uri` será `null` y `component` tendrá el valor
 * `null`.
 *
 * @remarks
 * Las rutas estáticas tienen prioridad sobre las parametrizadas. Esto
 * permite resolver coincidencias exactas mediante una búsqueda directa
 * sobre la tabla interna (complejidad promedio `O(1)`), reservando el
 * recorrido de las rutas parametrizadas únicamente para aquellos casos
 * en los que no exista una coincidencia literal.
 *
 * El despachador opera exclusivamente sobre la representación producida
 * por el analizador léxico de DLRoute. No interpreta cadenas ni aplica
 * reglas sintácticas propias; consume la URI canónica y los tokens ya
 * clasificados, delegando en {@link getValidateRoute} la extracción de
 * parámetros cuando la ruta registrada es parametrizada.
 *
 * Esta función no realiza el renderizado del recurso devuelto. Su
 * responsabilidad finaliza al determinar qué recurso corresponde a la
 * ruta actual y devolverlo al consumidor.
 *
 * @example
 * const result = dispatch();
 *
 * if (result.validated.validated) {
 *     render(result.component);
 * } else {
 *     render(NotFoundView);
 * }
 */
export declare function dispatch(): Dispatch;
