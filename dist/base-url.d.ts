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
import type { CurrentRouteType } from "./type.js";
/**
 * Obtiene la URL base canónica utilizada por el router del cliente.
 *
 * Si el documento contiene la metadata
 * `<meta name="dlroute:base-url">`, su valor se interpreta como la URL
 * base de la aplicación y se normaliza mediante
 * {@link parsing.getURLFromURL}. En caso contrario, se utiliza la URL
 * actual del navegador (`globalThis.location.href`) como valor por
 * defecto, igualmente normalizada.
 *
 * La normalización garantiza que el `pathname` de la URL se reconstruya
 * utilizando la misma semántica léxica que emplea el sistema de
 * enrutamiento, eliminando separadores redundantes y cualquier otra
 * transformación aplicada durante el análisis.
 *
 * @returns La URL base en su forma canónica.
 *
 * @remarks
 * Esta función nunca devuelve `null` ni lanza una excepción por ausencia
 * de la metadata. Si ésta no existe, adopta la URL actual como base,
 * permitiendo que el router continúe operando con una referencia
 * coherente incluso en contextos donde el backend no haya inyectado la
 * configuración correspondiente.
 */
export declare function getBaseURL(): string;
/**
 * Path relativo actual de la app + tokens (entrada de {@link dispatch}).
 *
 * @returns `{ uri, tokens }` con `uri` canónica relativa a la base del meta.
 * @throws {Error} Si falta `<meta name="dlroute:base-url">` (vía {@link getCanonicalURI}).
 *
 * @example
 * // meta content="https://example.com/app"
 * // location https://example.com/app/users/10
 * getRoute(); // { uri: '/users/10', tokens: [...] }
 */
export declare function getRoute(): CurrentRouteType;
/**
 * URL absoluta de un asset bajo la base de la app (`getBaseURL` + path canónico).
 *
 * @param uri - Path de recurso (p. ej. `/img/logo.png`); se normaliza con el lexer.
 */
export declare function asset(uri: string): string;
