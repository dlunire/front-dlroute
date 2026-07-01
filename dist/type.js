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
