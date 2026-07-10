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
export var TokenType;
(function (TokenType) {
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
    TokenType[TokenType["Static"] = 0] = "Static";
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
    TokenType[TokenType["Parameter"] = 1] = "Parameter";
})(TokenType || (TokenType = {}));
