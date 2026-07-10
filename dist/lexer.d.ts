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
import { type RouteType, type Token } from "./type.js";
/**
 * Reconstruye la URI canónica (depurada y normalizada) a partir de los
 * tokens del último análisis realizado.
 *
 * Devuelve siempre la ruta con `/` inicial, incluso cuando no hay
 * segmentos (en ese caso, representa la raíz `"/"`). Es la forma
 * canónica de la ruta: libre de separadores redundantes (`//`) y con
 * los espacios ya normalizados a `_` por {@link nextDelimiter}, útil
 * para comparar contra rutas registradas o construir URLs base.
 *
 * @returns URI normalizada. Ejemplo: a partir de tokens
 *          `['david', 'entorno']` devuelve `"/david/entorno"`.
 *          Si `tokens` está vacío, devuelve `"/"`.
 *
 * @remarks
 * Esta función exportada lee el estado dejado por el último análisis
 * (vía {@link scanner}, invocado por {@link getTokensFromURI},
 * {@link getTokensFromURL} o {@link getURIFromURL}). No tokeniza por
 * sí misma: si se invoca sin haber analizado ninguna URI previamente
 * en el ciclo de vida actual del módulo, devuelve `"/"` (el valor por
 * defecto de `tokens` vacío).
 *
 * @example
 * getTokensFromURI('/ciencias//de/la / computación');
 * getCanonicalURI(); // → "/ciencias/de/la/_computación"
 */
export declare function getCanonicalURI(): string;
/**
 * Tokeniza una URI y devuelve directamente sus tokens, en una sola
 * llamada.
 *
 * @param uri - URI a tokenizar (p. ej. `/users/123/profile?id=1`).
 *
 * @returns Un nuevo array con los tokens de `uri`. Al ser un snapshot
 *          (`[...tokens]`), es independiente del estado interno del
 *          módulo: una llamada posterior a cualquier función de este
 *          módulo no mutará el array ya retornado.
 *
 * @remarks
 * Gracias al reinicio de estado realizado por {@link scanner} (vía
 * {@link resetState}), cada llamada a `getTokensFromURI` es
 * independiente: no acumula tokens de invocaciones anteriores ni se ve
 * afectada por el cursor (`offset`) dejado por un análisis previo.
 *
 * @example
 * const tokens = getTokensFromURI('/users/123/profile');
 * // [{ lexeme: 'users', ... }, { lexeme: '123', ... }, { lexeme: 'profile', ... }]
 */
export declare function getTokensFromURI(uri: string): Token[];
/**
 * Extrae el `pathname` de una URL completa, lo tokeniza y devuelve sus
 * tokens.
 *
 * A diferencia de {@link getTokensFromURI}, que espera ya un path
 * (p. ej. `/users/123`), esta función acepta una URL absoluta
 * (p. ej. `https://api.dlunire.dev/users/123?id=1`) y delega en el
 * constructor nativo `URL` para extraer únicamente el `pathname` antes
 * de tokenizarlo, descartando protocolo, host, puerto y query string.
 *
 * @param url - URL completa y válida según el estándar WHATWG URL
 *              (p. ej. `https://dominio.com/ruta`). Si `url` no es una
 *              URL válida, el constructor nativo `URL` lanzará
 *              `TypeError`.
 *
 * @returns Un nuevo array con los tokens del `pathname` de `url`.
 *
 * @example
 * getTokensFromURL('https://api.dlunire.dev/ciencias/de/la/computación');
 * // [{ lexeme: 'ciencias', ... }, { lexeme: 'de', ... }, ...]
 */
export declare function getTokensFromURL(url: string): Token[];
/**
 * Extrae el `pathname` de una URL completa, lo tokeniza, y devuelve su
 * forma canónica ya depurada.
 *
 * Es el equivalente de {@link getCanonicalURI} pero partiendo de una
 * URL absoluta en vez de un path ya aislado: combina
 * {@link processURL} (tokenización del `pathname`) y la reconstrucción
 * canónica en una sola llamada.
 *
 * @param url - URL completa y válida según el estándar WHATWG URL.
 *              Si `url` no es una URL válida, el constructor nativo
 *              `URL` lanzará `TypeError`.
 *
 * @returns La URI canónica del `pathname` de `url`, normalizada y sin
 *          separadores redundantes.
 *
 * @example
 * getURIFromURL('https://api.dlunire.dev//users//123/');
 * // → "/users/123"
 */
export declare function getURIFromURL(url: string): string;
/**
 * Tokeniza una URI y devuelve directamente su forma canónica ya
 * depurada, en una sola llamada.
 *
 * Es el equivalente de {@link getURIFromURL} pero partiendo de un path
 * ya aislado (p. ej. `/users/123`) en vez de una URL absoluta: combina
 * {@link scanner} y {@link getCanonicalURI} para tokenizar y reconstruir
 * la URI normalizada sin que el consumidor tenga que hacer dos llamadas
 * separadas.
 *
 * @param uri - URI a depurar (p. ej. `/users//123/ /profile`). Puede
 *              contener separadores redundantes (`//`) o espacios, que
 *              serán normalizados durante el análisis.
 *
 * @returns La URI canónica: sin separadores redundantes, con `/`
 *          inicial, y con los espacios ya reemplazados por `_` (vía
 *          {@link nextDelimiter}).
 *
 * @remarks
 * A diferencia de {@link getTokensFromURI}, que expone los tokens
 * completos (lexema, offset, longitud), esta función está pensada para
 * el caso de uso más común en el contexto de un router: comparar o
 * normalizar una ruta de entrada contra rutas ya registradas, sin
 * necesidad de inspeccionar cada token por separado.
 *
 * @example
 * getURIFromURI('/ciencias//de/la / computación');
 * // → "/ciencias/de/la_/_computación"
 *
 * getURIFromURI('');
 * // → "/" (URI raíz, sin segmentos)
 */
export declare function getURIFromURI(uri: string): string;
/**
 * Construye un nuevo objeto `URL` a partir de una URL de entrada,
 * reemplazando su `pathname` por su versión canónica generada por
 * {@link getURIFromURI}.
 *
 * Esta función constituye el punto de entrada del sistema de
 * enrutamiento de DLUnire en el cliente: transforma una URL absoluta
 * en una representación canónica sobre la que el router puede operar
 * de forma determinista, independientemente de cómo haya sido escrita
 * originalmente.
 *
 * Conserva exclusivamente el `origin` (protocolo, host y puerto) de
 * la URL original. El `pathname` se normaliza mediante
 * {@link getURIFromURI}, mientras que el `search` (query string) y el
 * `hash` se descartan al construir el nuevo objeto `URL`.
 *
 * ...
 *
 * @remarks
 * Esta función actúa como adaptador entre la API nativa `URL` del
 * navegador (o de Node.js) y el analizador léxico de rutas de
 * DLUnire. El autómata únicamente procesa URIs (`pathname`), por lo
 * que la extracción y posterior reconstrucción de la URL completa se
 * realizan fuera del proceso de análisis.
 *
 * Gracias a ello, el router del cliente trabaja siempre sobre una
 * representación canónica de la ruta, utilizando exactamente la misma
 * semántica de normalización que el sistema de enrutamiento de
 * DLUnire. Esto garantiza que la resolución de rutas sea consistente
 * entre el cliente y el servidor.
 */
export declare function getURLFromURL(stringURL?: string): URL;
/**
 * Analiza una ruta y devuelve su representación canónica junto con su
 * clasificación léxica y los tokens que la componen.
 *
 * La ruta es procesada por {@link getURIFromURI}, que delega en el
 * autómata para normalizarla y producir los tokens correspondientes.
 * La clasificación se realiza recorriendo esos tokens: si al menos uno
 * corresponde a un parámetro ({@link TokenType.Parameter}), la ruta
 * completa se considera parametrizada; en caso contrario, se clasifica
 * como estática ({@link TokenType.Static}).
 *
 * @param uri - Ruta a analizar. Puede contener separadores redundantes
 *              (`//`), espacios o query string; todos serán normalizados
 *              o descartados por el autómata antes de clasificar.
 *
 * @returns Un objeto {@link RouteType} con:
 * - `uri`: representación canónica de la ruta, producida por
 *   {@link getURIFromURI}.
 * - `type`: clasificación léxica de la ruta
 *   ({@link TokenType.Static} o {@link TokenType.Parameter}).
 * - `tokens`: snapshot independiente de los tokens producidos durante
 *   el análisis. Al ser una copia (`[...tokens]`) y no una referencia
 *   al array interno del módulo, no se ve afectado por llamadas
 *   posteriores al autómata.
 *
 * @throws {Error} Si algún segmento de la ruta es un parámetro sin
 *         nombre (p. ej. `:`), propagado desde {@link getTokenType}.
 *
 * @remarks
 * La clasificación se realiza sobre el conjunto completo de tokens, no
 * sobre un segmento específico. Basta con que exista un único token de
 * tipo {@link TokenType.Parameter} para que toda la ruta sea
 * considerada parametrizada.
 *
 * **Sobre el reinicio de estado:** `resetState()` al inicio de esta
 * función es redundante en la práctica, ya que {@link getURIFromURI}
 * delega en {@link scanner}, que llama a {@link resetState}
 * internamente. Se conserva como salvaguarda explícita ante futuros
 * cambios en la implementación de {@link getURIFromURI} que pudieran
 * romper esa garantía implícita.
 *
 * **Sobre `[...tokens]`:** los tokens se retornan como snapshot y no
 * como referencia directa al array interno del módulo. Sin este spread,
 * una llamada posterior al autómata vaciaría o sobreescribiría los
 * tokens del {@link RouteType} ya retornado, ya que ambos apuntarían
 * al mismo objeto en memoria. Este fue el bug que motivó el uso de
 * `[...tokens]` en esta función.
 *
 * @example
 * parseRoute('/users/profile');
 * // {
 * //     uri: '/users/profile',
 * //     type: TokenType.Static,
 * //     tokens: [{ type: 0, lexeme: 'users', ... }, { type: 0, lexeme: 'profile', ... }]
 * // }
 *
 * @example
 * parseRoute('/users/:id/profile');
 * // {
 * //     uri: '/users/:id/profile',
 * //     type: TokenType.Parameter,
 * //     tokens: [{ type: 0, lexeme: 'users', ... }, { type: 1, lexeme: ':id', ... }, ...]
 * // }
 */
export declare function parseRoute(uri: string): RouteType;
