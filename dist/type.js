/**
 * DLUnire — @dlunire/front-dlroute
 * Copyright (c) 2026 David E. Luna M.
 *
 * SPDX-License-Identifier: MIT
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
export var TokenType;
(function (TokenType) {
    /**
     * Segmento literal. En match de patrones, la URL debe traer el mismo lexema.
     *
     * @example
     * /users/profile → "users" y "profile" son Static
     */
    TokenType[TokenType["Static"] = 0] = "Static";
    /**
     * Segmento dinámico (primer carácter `:` y nombre no vacío).
     *
     * @example
     * /users/:id → ":id" es Parameter
     */
    TokenType[TokenType["Parameter"] = 1] = "Parameter";
})(TokenType || (TokenType = {}));
