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
 * Contexto de **URL base** y path relativo de la aplicación en el navegador.
 *
 * El backend DLUnire inyecta `<meta name="dlroute:base-url" content="…">` en el
 * HTML. Así el cliente calcula la ruta *dentro de la app* (p. ej. `/users/10`)
 * aunque el documento se sirva bajo un subpath (`/app/...`).
 *
 * SSR y enrutamiento HTTP no viven aquí: los resuelve `dlunire/dlroute` en servidor.
 */
import * as parsing from "./lexer.js";
/**
 * URI canónica del `content` del meta `dlroute:base-url` (solo pathname normalizado).
 *
 * @example
 * // <meta name="dlroute:base-url" content="https://ejemplo.com/app">
 * // → "/app"
 *
 * @returns Path base canónico (p. ej. `/` o `/app`).
 * @throws {Error} Si falta el meta en el documento.
 *
 * @remarks
 * Usado por {@link determineRoute} para restar el prefijo de la app del path actual.
 * Preferible que el backend inyecte el meta; en demos locales puede fijarse a mano.
 */
function getCanonicalURI() {
    const metaElement = document.querySelector('meta[name="dlroute:base-url"]');
    if (!(metaElement instanceof HTMLMetaElement)) {
        throw new Error('Debe definir «<meta name="dlroute:base-url" content="..."»');
    }
    return parsing.getURIFromURL(metaElement.content);
}
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
export function getBaseURL() {
    const defaultURL = parsing.getURLFromURL().href;
    /** Metadata con la URL que tiene que ser analizada */
    const metaElement = document.querySelector('meta[name="dlroute:base-url"]');
    if (!(metaElement instanceof HTMLMetaElement)) {
        return defaultURL;
    }
    const href = parsing.getURLFromURL(metaElement.content).href;
    const processedHref = href[href.length - 1] === "/"
        ? href.substring(0, href.length - 1)
        : href;
    return processedHref;
}
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
export function getRoute() {
    return determineRoute();
}
/**
 * Resta el path base (meta) del path actual (`location`) y tokeniza el resto.
 *
 * Ambas cadenas se normalizan con el lexer antes de comparar carácter a carácter.
 *
 * @internal
 */
function determineRoute() {
    const dlunire = 'https://dlunire.dev';
    /** Path canónico de la URL del navegador. */
    const currentURI = parsing.getURIFromURL(globalThis.location?.href ?? dlunire);
    /** Path canónico de la base de la app (meta). */
    const uri = getCanonicalURI();
    let offset = 0;
    const { length: size } = uri;
    while (offset < size) {
        if (uri[offset] !== currentURI[offset]) {
            break;
        }
        offset++;
    }
    const route = currentURI.substring(offset);
    const processedRoute = route[0] === "/"
        ? route
        : `${currentURI.substring(offset - 1)}`;
    const tokens = parsing.getTokensFromURI(processedRoute);
    return {
        uri: processedRoute,
        tokens: [...tokens]
    };
}
/**
 * URL absoluta de un asset bajo la base de la app (`getBaseURL` + path canónico).
 *
 * @param uri - Path de recurso (p. ej. `/img/logo.png`); se normaliza con el lexer.
 */
export function asset(uri) {
    return `${getBaseURL()}${parsing.getURIFromURI(uri)}`;
}
