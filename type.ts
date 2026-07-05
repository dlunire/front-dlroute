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
 * Clasificación léxica de los segmentos reconocidos por el analizador
 * de rutas.
 *
 * El tipo se determina durante la fase de análisis léxico y representa
 * la función sintáctica que desempeña cada segmento dentro de una ruta.
 * Esto permite que las etapas posteriores del motor de enrutamiento
 * trabajen sobre tokens ya clasificados, evitando reinterpretar los
 * lexemas durante la resolución de rutas.
 */
export enum TokenType {

    /**
     * Segmento literal de la ruta.
     *
     * Debe coincidir exactamente con el segmento correspondiente de la
     * ruta analizada.
     *
     * @example
     * /users/profile
     * // "users" y "profile" son segmentos estáticos.
     */
    Static,

    /**
     * Segmento parametrizado.
     *
     * Representa un valor dinámico dentro de la ruta. Su identificación
     * se realiza durante el análisis léxico a partir de la gramática del
     * lenguaje de rutas (por ejemplo, un segmento cuyo primer carácter
     * es `:`).
     *
     * @example
     * /users/:id
     * // ":id" es un parámetro.
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

export interface Dispatch {
    validated: ValidatedRoute;
    component: unknown;
}