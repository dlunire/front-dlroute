/**
 * DLUnire — @dlunire/front-dlroute
 * Copyright (c) 2026 David E. Luna M.
 *
 * SPDX-License-Identifier: MIT
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
import type { CurrentRouteType, Token } from "./type.js";

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
function getCanonicalURI(): string {
    const metaElement: HTMLElement | null = document.querySelector<HTMLMetaElement>('meta[name="dlroute:base-url"]');

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
export function getBaseURL(): string {

    const defaultURL: string = parsing.getURLFromURL().href;

    /** Metadata con la URL que tiene que ser analizada */
    const metaElement: HTMLMetaElement | null = document.querySelector<HTMLMetaElement>('meta[name="dlroute:base-url"]');

    if (!(metaElement instanceof HTMLMetaElement)) {
        return defaultURL;
    }

    const href = parsing.getURLFromURL(metaElement.content).href;

    const processedHref: string = href[href.length - 1] === "/"
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
export function getRoute(): CurrentRouteType {
    return determineRoute();
}

/**
 * Calcula la ruta **relativa a la app** y sus tokens léxicos.
 *
 * 1. Obtiene el path canónico actual desde `globalThis.location.href`
 *    (normalizado con el lexer). Si no hay `location` o `href`, usa `"/"`.
 * 2. Obtiene el path base canónico del meta `dlroute:base-url`
 *    ({@link getCanonicalURI}; lanza si falta el meta).
 * 3. Resta el prefijo base del path actual comparando carácter a carácter
 *    (ambas cadenas ya normalizadas por el lexer).
 * 4. Asegura que el resto empiece por `/` y tokeniza el resultado.
 *
 * No usa ningún dominio fijo del framework como fallback de URL.
 *
 * @returns Objeto con `uri` (path relativo canónico) y `tokens` (copia del análisis).
 *
 * @internal
 */
function determineRoute(): CurrentRouteType {

    /** URL actual o valor nulo si no es posible */
    const url: string | null = globalThis.location?.href ?? null;

    /** Path canónico de la URL del navegador (o `"/"` sin location/href). */
    const currentURI: string = url !== null
        ? parsing.getURIFromURL(url)
        : "/";

    /** Path canónico de la base de la app (meta). */
    const uri: string = getCanonicalURI();

    let offset = 0;
    const { length: size } = uri;

    while (offset < size) {
        if (uri[offset] !== currentURI[offset]) {
            break;
        }
        offset++;
    }

    const route: string = currentURI.substring(offset);

    const processedRoute = route[0] === "/"
        ? route
        : `${currentURI.substring(offset - 1)}`;

    const tokens: Token[] = parsing.getTokensFromURI(processedRoute);

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
export function asset(uri: string): string {
    return `${getBaseURL()}${parsing.getURIFromURI(uri)}`;
}