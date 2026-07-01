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
export declare function getRoute(): CurrentRouteType;
export declare function asset(uri: string): string;
