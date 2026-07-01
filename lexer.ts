import { TokenType, type RouteType, type Token } from "./type";

/** Tokens  capturados durante el análisis léxico */
const tokens: Token[] = [];

/** Posición del cursor del autómata. */
let offset: number = 0;

/** Tamaño en caracteres a ser analizado */
let size: number = 0;

/** Entrada a ser analizada */
let input: string = "";

/** Separador de ruta */
const SEPARATOR: string = "/";

/** Separador de parámetro de consulta */
const QUERY_STRING_SEPARATOR: string = "?";

/**
 * Prefijo que identifica un segmento parametrizado dentro del lenguaje
 * de rutas.
 *
 * Durante el análisis léxico se utiliza para clasificar un lexema como
 * {@link TokenType.Parameter}. Cualquier segmento cuyo primer carácter
 * sea `:` se interpreta como un parámetro; en caso contrario, se
 * considera un segmento {@link TokenType.Static}.
 */
const COLON: string = ":";

/**
 * Reinicia el estado del autómata a sus valores iniciales.
 *
 * @remarks
 * **Modelo mental PHP vs TypeScript:**
 *
 * En PHP, una propiedad declarada como `private int $offset = 0;` se
 * reinicia **implícitamente** cada vez que se crea una nueva instancia
 * de la clase: el constructor (explícito o no) asigna ese valor inicial
 * por instancia, de forma automática, vía `$this->offset = 0`. El
 * aislamiento de estado entre análisis es una consecuencia natural del
 * modelo de objetos: una instancia nueva siempre nace con estado nuevo.
 *
 * En este módulo de TypeScript no existe ese reinicio implícito, porque
 * `offset`, `tokens` e `input` no son propiedades de instancia, sino
 * variables de módulo cerradas sobre el closure del archivo. El módulo
 * se importa una sola vez y persiste mientras viva el proceso de Node,
 * por lo que su estado sobrevive entre llamadas exactamente igual que
 * sobreviviría una propiedad `static` en PHP, no una propiedad de
 * instancia. No hay un "constructor" que se ejecute en cada análisis;
 * por tanto, el reinicio que el modelo mental de PHP daba por
 * garantizado aquí debe **hacerse explícito**, llamando a
 * `resetState()` al inicio de cada ciclo de tokenización.
 *
 * **Referencias vs. valores — por qué `tokens.length = 0` y no `tokens = []`:**
 *
 * `tokens` está declarado como `const`, por lo que reasignarlo
 * (`tokens = []`) no compila. Pero incluso si estuviera declarado como
 * `let`, reasignarlo crearía un array nuevo en memoria, dejando al
 * descubierto el array anterior al que cualquier {@link RouteType} ya
 * retornado seguiría apuntando, con sus tokens intactos pero
 * desconectado del autómata.
 *
 * `tokens.length = 0` vacía el contenido del array **sin romper la
 * referencia**: todos los que apunten a `tokens` verán el array vacío,
 * y el autómata seguirá trabajando sobre el mismo objeto en memoria.
 * Por eso es la forma correcta de limpiar el estado interno.
 *
 * La contraparte de esto en las funciones que retornan tokens al
 * exterior es siempre devolver un snapshot (`[...tokens]`), no la
 * referencia directa. Sin ese spread, cualquier objeto que reciba
 * `tokens` quedaría expuesto a mutaciones futuras del autómata:
 * `resetState` lo vaciaría, y `scanner` lo llenaría con los tokens de
 * la siguiente URI, contaminando silenciosamente el resultado ya
 * entregado. Ese fue exactamente el bug que se manifestó en
 * {@link parseRoute} antes de aplicar `[...tokens]`.
 *
 * En resumen:
 * - `tokens.length = 0` controla la referencia **interna**.
 * - `[...tokens]` protege la referencia **externa**.
 * - Ambas son necesarias; ninguna reemplaza a la otra.
 *
 * @example
 * // PHP (implícito, vía instanciación):
 * // $lexer = new Lexer(); // offset = 0, tokens = [] y input = '' por nacimiento
 *
 * // TypeScript (explícito, vía función de reseteo):
 * function scanner(uri: string = ''): void {
 *     resetState(); // equivalente funcional al constructor de PHP
 *     // ...
 * }
 */
function resetState(): void {
    offset = 0;
    tokens.length = 0;
    input = '';
}

/**
 * Analiza una URI y la descompone en segmentos usando un autómata de estados finitos.
 *
 * El scanner recorre la URI carácter por carácter, identifica separadores (`/`)
 * y delimitadores, y extrae los segmentos intermedios para su procesamiento.
 * Se detiene al encontrar el inicio de un query string (`?`).
 *
 * @param uri - URI a analizar. Si se omite o está vacía, se usa el valor
 *              actual de la variable global `input`.
 *
 * @remarks
 * **Reinicio de estado:** cada invocación de `scanner` llama a
 * {@link resetState}, garantizando que cada análisis es idempotente y
 * autocontenido: nunca acumula tokens de análisis anteriores ni hereda
 * un cursor desfasado que pudiera dejar al bucle principal sin
 * ejecutarse. No debe invocarse directamente desde fuera del módulo;
 * los puntos de entrada públicos son {@link getTokensFromURI},
 * {@link getTokensFromURL} y {@link getURIFromURL}.
 */
function scanner(uri: string = ''): void {
    resetState();

    input = `/${uri.trim() === '' ? input : uri}/`;
    size = input.length;

    /** Posición actual del autómata */
    let start: number = 0;

    /** Separador almacenado temporalmente */
    let separator: string | null = null;

    while (offset < size) {

        /** Carácter actual */
        const char: string = input[offset];

        /** Siguiente byte a ser analizado */
        const pick: string | null = input[offset + 1] ?? null;

        if (char === QUERY_STRING_SEPARATOR) {
            break;
        }

        if (char === SEPARATOR && pick === SEPARATOR) {
            offset++;
            continue;
        }

        if (char === SEPARATOR && pick !== SEPARATOR) {
            separator = SEPARATOR;
            offset++;
            continue;
        }

        if (separator === SEPARATOR) {
            separator = null;
            start = offset - 1;
        }

        if (start >= offset) continue;
        nextDelimiter();

        offset++;
    }
}

/**
 * Avanza el cursor desde la posición actual hasta el próximo delimitador
 * (`/` o `?`) y registra el segmento encontrado como un token.
 *
 * Este función actúa como sub-autómata dentro de {@link scanner}: una vez
 * que `scanner` identifica el inicio de un segmento, delega en `nextDelimiter`
 * la lectura carácter por carácter hasta encontrar el final del mismo.
 *
 * Comportamiento especial:
 * - Si encuentra un espacio (` `), lo reemplaza por `_` directamente en `input`
 *   para normalizar la URI antes de tokenizar.
 * - Si encuentra `?`, retrocede un paso (`offset--`) para que `scanner`
 *   pueda detectarlo y detener el análisis principal.
 * - El token generado incluye la lexema, su posición de inicio y su longitud.
 *
 * @remarks
 * Modifica las variables globales `offset`, `input` y `tokens`.
 * No debe llamarse directamente fuera del contexto de {@link scanner}.
 */
function nextDelimiter(): void {

    const currentOffset = offset;

    /** Se utilizará solo cuando se encuentre el símbolo `?` */
    let end: number | null = null;

    while (offset < size) {

        /** Carácter actual capturado por el autómata */
        const char: string = input[offset];

        if (char === QUERY_STRING_SEPARATOR) {
            end = offset--;
            break;
        }

        if (char === ' ') {
            input = input.slice(0, offset) + "_" + input.slice(offset + 1);
        }

        if (char === SEPARATOR) {
            break;
        }

        offset++;
    }

    /**
     * Lexema reconocido por el autómata.
     *
     * Normalmente el final del lexema está determinado por la posición
     * actual del cursor (`offset`), que apunta al delimitador `/` donde
     * termina el segmento.
     *
     * Sin embargo, cuando el análisis finaliza al encontrar el símbolo
     * `?`, `offset` se decrementa previamente (`offset--`) para devolver
     * el control a {@link scanner}, permitiéndole detectar el inicio del
     * query string y finalizar el análisis principal.
     *
     * En ese escenario, la posición original del `?` se conserva en
     * `end`, utilizándose como límite superior de `substring()` para
     * excluir el carácter `?` del lexema capturado.
     */
    const lexeme: string = input.substring(currentOffset, end ?? offset);

    tokens.push({
        type: getTokenType(lexeme),
        lexeme,
        offset: currentOffset - 1,
        length: offset - currentOffset + (end ? 1 : 0),
    });
}

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
export function getCanonicalURI(): string {
    return `/${tokens.map(token => token.lexeme).join("/")}`;
}

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
export function getTokensFromURI(uri: string): Token[] {
    scanner(uri);
    return [...tokens];
}

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
export function getTokensFromURL(url: string): Token[] {
    processURL(url);
    return [...tokens];
}

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
export function getURIFromURL(url: string): string {
    processURL(url);
    return getCanonicalURI();
}

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
export function getURIFromURI(uri: string): string {
    scanner(uri);
    return getCanonicalURI();
}

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
export function getURLFromURL(stringURL: string = ''): URL {
    if (stringURL.trim() === '') {
        stringURL = globalThis.location?.href ?? 'https://dlunire.dev';
    }

    const url: URL = new URL(stringURL);
    const uri: string = getURIFromURI(url.pathname);

    return new URL(`${url.origin}${uri}`);
}

/**
 * Construye un objeto `URL` a partir de `url` y tokeniza únicamente su
 * `pathname`, descartando protocolo, host, puerto y query string.
 *
 * Es la función puente que comparten {@link getTokensFromURL} y
 * {@link getURIFromURL}: ambas la usan para no duplicar la lógica de
 * extracción del `pathname` antes de delegar en {@link scanner}.
 *
 * @param url - URL completa y válida según el estándar WHATWG URL.
 *
 * @throws {TypeError} Si `url` no es una URL absoluta válida (propagado
 *         directamente desde el constructor nativo `URL`).
 *
 * @remarks
 * No debe llamarse directamente fuera del módulo; es un detalle de
 * implementación interno, no un punto de entrada público.
 */
function processURL(url: string): void {
    const currentURL: URL = new URL(url);
    scanner(currentURL.pathname);
}

/**
 * Determina la clasificación léxica de un segmento de ruta.
 *
 * La clasificación se realiza exclusivamente a partir de la gramática
 * del lenguaje de rutas. Un segmento cuyo primer carácter es `:` se
 * interpreta como un parámetro; cualquier otro segmento se considera
 * un literal de la ruta.
 *
 * Esta clasificación se efectúa durante el análisis léxico para que
 * las etapas posteriores del sistema de enrutamiento trabajen sobre
 * tokens ya clasificados, evitando reinterpretar los lexemas durante
 * la resolución de rutas.
 *
 * @param lexeme - Lexema reconocido por el autómata.
 *
 * @returns El tipo léxico correspondiente al segmento:
 * - {@link TokenType.Parameter} si el lexema comienza con `:` y tiene
 *   al menos un carácter adicional tras él.
 * - {@link TokenType.Static} en cualquier otro caso.
 *
 * @throws {Error} Si el lexema es clasificado como
 *         {@link TokenType.Parameter} pero su longitud es menor o
 *         igual a `1` (es decir, el lexema es únicamente `:`, un
 *         parámetro sin nombre), ya que la gramática del lenguaje de
 *         rutas exige al menos un carácter después del prefijo `:`
 *         para que el segmento sea un parámetro válido (p. ej. `:id`,
 *         no `:` a secas).
 *
 * @remarks
 * Esta función implementa una regla de la gramática del lenguaje de
 * rutas, no una decisión propia del enrutador. Su responsabilidad
 * abarca dos aspectos: clasificar el lexema producido por el
 * analizador léxico según su forma sintáctica, y validar que, cuando
 * se clasifica como {@link TokenType.Parameter}, el lexema tenga
 * contenido más allá del prefijo `:` — un parámetro sin nombre no es
 * una construcción válida del lenguaje y se rechaza en esta misma
 * fase, antes de que el resto del sistema de enrutamiento llegue a
 * procesarlo.
 *
 * La validación usa `size <= 1` en vez de `size === 1`: dado que
 * `tokenType` solo puede ser {@link TokenType.Parameter} cuando
 * `lexeme[0] === COLON` (lo que ya garantiza `size >= 1`), el caso
 * `size === 1` es el único alcanzable en la práctica (`:` a secas).
 * El uso de `<=` deja la validación cubierta también ante un eventual
 * lexema vacío que llegara clasificado como `Parameter` por cualquier
 * cambio futuro en la regla de clasificación, sin depender de que esa
 * invariante se mantenga intacta para siempre.
 *
 * @example
 * getTokenType(':id');   // → TokenType.Parameter
 * getTokenType('users'); // → TokenType.Static
 * getTokenType(':');     // → throws Error
 */
function getTokenType(lexeme: string): TokenType {
    const tokenType: TokenType = lexeme[0] === COLON
        ? TokenType.Parameter
        : TokenType.Static;

    const { length: size } = lexeme;

    if (tokenType === TokenType.Parameter && size <= 1) {
        throw new Error(`Se requiere mínimo un carácter para el parámetro. Solo se obtuvo ':'`);
    }

    return tokenType;
}

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
export function parseRoute(uri: string): RouteType {
    resetState();
    uri = getURIFromURI(uri);

    let tokenType: TokenType = TokenType.Static;

    for (const token of tokens) {
        if (token.type === TokenType.Parameter) {
            tokenType = token.type;
            break;
        }
    }

    return {
        uri,
        type: tokenType,
        tokens: [...tokens]
    };
}

