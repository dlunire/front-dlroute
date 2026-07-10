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
 * Tipos del enrutador cliente `@dlunire/front-dlroute`.
 *
 * Gramática de segmentos de path (cliente):
 * - literal → {@link TokenType.Static}
 * - prefijo `:` + nombre → {@link TokenType.Parameter} (p. ej. `:id`)
 *
 * Nota: en el backend PHP (`dlunire/dlroute`) los params de plantilla suelen
 * escribirse `{id}`; aquí la gramática de UI usa `:id`. La **normalización**
 * de path busca alinearse; la sintaxis de plantilla no es idéntica carácter a carácter.
 */

/**
 * Clasificación de un segmento de path tras el análisis léxico.
 *
 * También etiqueta una **ruta completa** en el registro:
 * - `Static` (0) — ningún segmento param → clave de tabla `0-…`
 * - `Parameter` (1) — al menos un `:param` → clave `1-…`
 */
export enum TokenType {

    /**
     * Segmento literal. En match de patrones, la URL debe traer el mismo lexema.
     *
     * @example
     * /users/profile → "users" y "profile" son Static
     */
    Static,

    /**
     * Segmento dinámico (primer carácter `:` y nombre no vacío).
     *
     * @example
     * /users/:id → ":id" es Parameter
     */
    Parameter
}

/**
 * Token producido por el analizador léxico de rutas.
 *
 * Cada token representa un único segmento reconocido por el autómata e
 * incluye tanto la información léxica (lexema, posición y longitud)
 * como su clasificación sintáctica ({@link TokenType}).
 *
 * Los tokens constituyen la representación intermedia utilizada por el
 * sistema de enrutamiento para reconstruir rutas canónicas, resolver
 * rutas parametrizadas y realizar comparaciones estructurales entre
 * rutas registradas y rutas de entrada.
 */
export interface Token {

    /**
     * Clasificación léxica del segmento.
     */
    type: TokenType;

    /**
     * Texto original reconocido para el segmento.
     *
     * Su interpretación depende de {@link type}. Por ejemplo, un token
     * de tipo {@link TokenType.Parameter} puede contener un nombre de
     * parámetro como `:id`, mientras que uno de tipo
     * {@link TokenType.Static} representa un segmento literal.
     */
    lexeme: string;

    /**
     * Posición inicial del segmento dentro de la cadena analizada.
     *
     * Se expresa como un índice basado en cero.
     */
    offset: number;

    /**
     * Longitud del segmento, expresada en caracteres.
     *
     * Este campo puede omitirse cuando la longitud no sea necesaria
     * para la operación que produjo el token.
     */
    length?: number;
}

export interface RouteType {
    uri: string;
    type: TokenType;
    tokens: Token[],
    component?: unknown
}

export interface CurrentRouteType {
    uri: string;
    tokens: Token[];
}

export interface Param {
    [x: string]: string;
}

export interface ValidatedRoute {
    param: Param;
    validated: boolean;
    uri: string | null;
}

/**
 * Resultado de `dispatch()`: recurso de UI + validación/params.
 * El núcleo no renderiza; la capa de presentación interpreta `component`.
 */
export interface Dispatch {
    validated: ValidatedRoute;
    /** Recurso registrado con `route()`, o `null` si no hubo match. */
    component: unknown;
}