import * as parsing from "./lexer";
import type { CurrentRouteType, Token } from "./type";

/**
 * Obtiene la URI canónica configurada como base del enrutador.
 *
 * La URI se extrae del elemento:
 *
 * ```html
 * <meta name="dlroute:base-url" content="https://ejemplo.com/app">
 * ```
 *
 * El valor del atributo `content` se interpreta como una URL absoluta y
 * se normaliza mediante {@link parsing.getURIFromURL}, garantizando que
 * la URI resultante utilice exactamente la misma semántica de
 * normalización que el resto del sistema de enrutamiento (eliminación de
 * separadores redundantes, normalización de espacios y descarte del
 * query string).
 *
 * Esta metadata es generada por el backend y representa la ruta base
 * sobre la que opera el router del cliente. No está pensada para ser
 * definida manualmente por el desarrollador durante la ejecución de la
 * aplicación.
 *
 * @returns La URI base en su forma canónica.
 *
 * @throws {Error} Si no existe el elemento
 *         `<meta name="dlroute:base-url">` en el documento.
 *
 * @remarks
 * La URI devuelta se utiliza posteriormente para calcular la ruta
 * relativa de la petición actual mediante la diferencia entre la URI
 * canónica actual y esta URI base.
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
 * Obtiene la ruta relativa sobre la que debe operar el router del
 * cliente.
 *
 * La ruta se calcula a partir de la URL actual del navegador y de la
 * URL base de la aplicación, ambas previamente normalizadas mediante el
 * analizador léxico de DLRoute. El resultado corresponde al segmento de
 * la URI que permanece después de eliminar el prefijo representado por
 * la ruta base.
 *
 * @returns La ruta relativa en su forma canónica.
 *
 * @remarks
 * Esta función constituye el punto de entrada público para obtener la
 * ruta actual del cliente. La lógica de cálculo se delega en
 * {@link determineRoute}, manteniendo encapsulado el algoritmo de
 * determinación de la ruta y ofreciendo una API estable al consumidor.
 */
export function getRoute(): CurrentRouteType {
    return determineRoute();
}

/**
 * Determina la ruta relativa de la petición actual respecto a la ruta
 * base de la aplicación.
 *
 * Para ello, obtiene la URI canónica de la URL actual del navegador y
 * la URI base definida por el backend, ambas previamente normalizadas
 * por el analizador léxico de DLRoute. A continuación, recorre ambas
 * cadenas desde el inicio hasta localizar el primer carácter en el que
 * difieren; dicho punto constituye el límite entre la ruta base y la
 * ruta relativa.
 *
 * El segmento restante de la URI actual se devuelve como la ruta sobre
 * la que deberá operar el router del cliente.
 *
 * @returns La ruta relativa en su forma canónica, siempre con un `/`
 *          inicial.
 *
 * @remarks
 * El algoritmo realiza una comparación secuencial de caracteres en
 * lugar de comparar token a token. Esto es posible porque tanto la URI
 * actual como la URI base ya fueron normalizadas previamente mediante
 * el analizador léxico, por lo que ambas comparten la misma
 * representación canónica antes de calcular la ruta relativa.
 *
 * La URI base es inyectada por el backend a través de la metadata
 * `dlroute:base-url`. Si la petición corresponde a una ruta distinta de
 * la aplicación, normalmente el servidor responderá antes con un error
 * de enrutamiento (por ejemplo, `404 Not Found`), por lo que esta
 * función opera sobre un contexto de rutas ya validado.
 *
 * Como medida de consistencia, el valor devuelto siempre comienza con
 * `/`, incluso cuando la primera diferencia entre ambas URIs ocurre en
 * una posición distinta del separador de segmentos.
 */
function determineRoute(): CurrentRouteType {
    /** URL base del ecosistema DLUnire */
    const dlunire: string = 'https://dlunire.dev';

    /** Tokens capturados */
    const currentURI: string = parsing.getURIFromURL(globalThis.location?.href ?? dlunire);

    /** URI formada a partir los tokens capturados durante el análisis léxico */
    // const currentURI: string = `/${tokens.map((token) => token.lexeme).join("/")}`;

    /** URI Canónico */
    const uri: string = getCanonicalURI();

    /** Posición del cursor del autómata */
    let offset = 0;

    const { length: size } = uri;

    while (offset < size) {
        if (uri[offset] !== currentURI[offset]) {
            break;
        }

        offset++;
    }

    /** Ruta determinada durante el análisis  */
    const route: string = currentURI.substring(offset);

    /** Ruta procesada */
    const processedRoute = route[0] === "/"
        ? route
        : `/${currentURI.substring(offset - 1)}`;

    /** Token capturado durante el análisis léxico de la ruta procesada */
    const tokens: Token[] = parsing.getTokensFromURI(processedRoute);

    return {
        uri: processedRoute,
        tokens: [...tokens]
    };
}

export function asset(uri: string): string {
    return `${getBaseURL()}${parsing.getURIFromURI(uri)}`;
}