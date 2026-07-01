import * as parsing from "./lexer";
import * as routing from "./base-url";

import { TokenType, type CurrentRouteType, type Dispatch, type Param, type RouteType, type Token, type ValidatedRoute } from "./type";


/**
 * Tabla interna de rutas registradas por el router.
 *
 * Cada entrada se indexa mediante una clave compuesta por el tipo de la
 * ruta y su URI canónica (`<tipo>-<uri>`), lo que permite distinguir
 * rutas estáticas y parametrizadas aun cuando compartan una misma forma
 * textual.
 *
 * @remarks
 * Esta estructura constituye el registro interno utilizado durante el
 * proceso de construcción del conjunto de rutas. Las claves se generan
 * exclusivamente a partir de la representación canónica producida por el
 * analizador léxico de DLRoute.
 */
const routes: { [x: string]: RouteType } = {};

/**
 * Registra una nueva ruta dentro de la tabla interna del router.
 *
 * La ruta es analizada previamente por el parser para obtener su
 * representación canónica, determinar si es estática o
 * parametrizada, y generar la información estructurada que utilizará
 * el despachador durante la resolución de rutas.
 *
 * Una vez procesada, se asocia el recurso suministrado mediante
 * `component` y la ruta queda indexada utilizando una clave compuesta
 * por su tipo y su URI canónica (`<tipo>-<uri>`), permitiendo una
 * búsqueda eficiente durante el despacho.
 *
 * @param uri - Ruta a registrar dentro del router. Puede contener
 *              segmentos estáticos y parametrizados conforme a la
 *              gramática del lenguaje de rutas de DLRoute.
 *
 * @param component - Recurso asociado a la ruta registrada. Se declara
 *                    como `unknown` para mantener el núcleo del router
 *                    independiente de cualquier framework o biblioteca
 *                    de interfaz de usuario. El consumidor puede
 *                    asociar componentes, funciones, objetos, módulos
 *                    cargados dinámicamente o cualquier otra
 *                    representación que considere apropiada.
 *
 * @remarks
 * Esta función forma parte de la fase de construcción del router y no
 * participa en la resolución de rutas. Su única responsabilidad es
 * registrar rutas ya analizadas dentro de la tabla interna utilizada
 * posteriormente por {@link dispatch}.
 *
 * La representación almacenada proviene exclusivamente de
 * {@link parsing.parseRoute}, garantizando que todas las rutas
 * registradas compartan la misma semántica de normalización empleada
 * durante el despacho.
 *
 * @example
 * route('/users', UsersComponent);
 * route('/users/:id', UserDetailComponent);
 */
export function route(uri: string, component: unknown): void {
    const route: RouteType = parsing.parseRoute(uri);

    /**
     * Justo aquí se inyecta el componente, pero la propopiedad `component` tiene
     * tipo como `unknown` para no ligarla necesariamente a Svelte, ya que la 
     * idea es buscar compatibilidad con otras herramientas.
     */
    route.component = component;

    routes[`${route.type}-${route.uri}`] = route;
}

/**
 * Elimina todas las rutas registradas del despachador.
 *
 * Vacía por completo la tabla interna utilizada durante el proceso de
 * resolución de rutas, dejando el router en el mismo estado que tendría
 * inmediatamente después de cargarse el módulo, antes de registrar
 * cualquier ruta mediante {@link route}.
 *
 * @remarks
 * Esta operación elimina tanto las rutas estáticas como las
 * parametrizadas, junto con los recursos asociados a cada una de ellas.
 * Resulta útil en escenarios donde el conjunto de rutas debe
 * reconstruirse completamente, como durante pruebas, recargas en
 * caliente (Hot Module Replacement) o procesos de inicialización del
 * router.
 *
 * La limpieza se realiza sobre el mismo objeto interno, eliminando cada
 * una de sus entradas mediante `delete`, en lugar de reemplazar la
 * referencia por un nuevo objeto. De este modo, cualquier referencia
 * existente a {@link getRoutes} continúa apuntando a la misma instancia,
 * observando el estado actualizado del registro.
 *
 * @example
 * route('/users', UsersComponent);
 * route('/posts/:id', PostComponent);
 *
 * resetState();
 *
 * getRoutes(); // → {}
 */
export function resetState(): void {
    for (const index in routes) {
        delete routes[index];
    }
}

/**
 * Obtiene el registro interno de rutas del router.
 *
 * Devuelve la tabla que contiene todas las rutas registradas mediante
 * {@link route}, indexadas por su clave canónica (`<tipo>-<uri>`). Cada
 * entrada almacena la representación estructurada de la ruta y el
 * recurso asociado a ella.
 *
 * @returns La tabla interna de rutas registradas.
 *
 * @remarks
 * Esta función expone la misma instancia utilizada internamente por el
 * router; no crea una copia del registro. En consecuencia, cualquier
 * modificación realizada sobre el objeto devuelto afectará
 * directamente al estado interno del despachador.
 *
 * Está pensada principalmente para tareas de inspección, depuración,
 * pruebas automatizadas o herramientas de desarrollo que necesiten
 * consultar el conjunto de rutas registradas.
 *
 * @example
 * route('/users', UsersComponent);
 * route('/users/:id', UserDetailComponent);
 *
 * const routes = getRoutes();
 *
 * console.log(Object.keys(routes));
 * // → ['0-/users', '1-/users/:id']
 */
export function getRoutes(): { [x: string]: RouteType } {
    return routes;
}

/**
 * Resuelve la ruta correspondiente a la URL actual y devuelve el
 * recurso asociado a ella.
 *
 * El despachador constituye el núcleo del sistema de enrutamiento del
 * cliente. A partir de la ruta actual obtenida mediante
 * {@link routing.getRoute}, determina cuál de las rutas previamente
 * registradas representa la mejor coincidencia y devuelve tanto la
 * información de validación como el recurso asociado.
 *
 * El proceso de resolución se realiza en dos etapas:
 *
 * 1. Se intenta localizar una coincidencia exacta entre las rutas
 *    estáticas mediante una búsqueda directa sobre la tabla interna.
 * 2. Si no existe una coincidencia estática, se recorren únicamente las
 *    rutas parametrizadas para determinar si alguna coincide con la
 *    estructura de la ruta actual y extraer los valores de sus
 *    parámetros.
 *
 * Si ninguna ruta coincide, la función devuelve un resultado no
 * validado y un recurso nulo (`component = null`), permitiendo que la
 * capa superior decida cómo gestionar la navegación (por ejemplo,
 * mostrando una vista 404).
 *
 * @returns Información del resultado del despacho. Cuando la resolución
 *          tiene éxito, el objeto contiene:
 *
 * - `validated`: información sobre la ruta coincidente y los parámetros
 *   extraídos.
 * - `component`: recurso asociado a la ruta registrada.
 *
 * Si no existe ninguna coincidencia, `validated.validated` será
 * `false`, `validated.uri` será `null` y `component` tendrá el valor
 * `null`.
 *
 * @remarks
 * Las rutas estáticas tienen prioridad sobre las parametrizadas. Esto
 * permite resolver coincidencias exactas mediante una búsqueda directa
 * sobre la tabla interna (complejidad promedio `O(1)`), reservando el
 * recorrido de las rutas parametrizadas únicamente para aquellos casos
 * en los que no exista una coincidencia literal.
 *
 * El despachador opera exclusivamente sobre la representación producida
 * por el analizador léxico de DLRoute. No interpreta cadenas ni aplica
 * reglas sintácticas propias; consume la URI canónica y los tokens ya
 * clasificados, delegando en {@link getValidateRoute} la extracción de
 * parámetros cuando la ruta registrada es parametrizada.
 *
 * Esta función no realiza el renderizado del recurso devuelto. Su
 * responsabilidad finaliza al determinar qué recurso corresponde a la
 * ruta actual y devolverlo al consumidor.
 *
 * @example
 * const result = dispatch();
 *
 * if (result.validated.validated) {
 *     render(result.component);
 * } else {
 *     render(NotFoundView);
 * }
 */
export function dispatch(): Dispatch {
    /** Ruta actual capturada */
    const route: CurrentRouteType = routing.getRoute();

    const { uri, tokens: currentTokens } = route;

    /** Información adicional de rutas validadas */
    let validatedRoute: ValidatedRoute | null = null;

    /** Ruta registrada que coincide con la URI canónica estática */
    const matchedRoute = routes[`0-${uri}`] ?? null;

    if (matchedRoute) {
        return {
            validated: {
                param: {},
                uri: `0-${matchedRoute.uri}`,
                validated: true
            },

            component: matchedRoute.component
        };
    }

    for (const route in routes) {
        if (route[0] === `${TokenType.Static}`) continue;
        validatedRoute = getValidateRoute(route, currentTokens);
        if (validatedRoute.validated) break;
    }

    if (validatedRoute && validatedRoute.uri) {
        return {
            validated: validatedRoute,
            component: routes[validatedRoute.uri].component
        }
    }

    return {
        validated: {
            param: {},
            uri: null,
            validated: false
        },

        component: null
    }
}

/**
 * Determina si una ruta parametrizada registrada coincide con la ruta
 * actual y, en caso afirmativo, extrae los valores de sus parámetros.
 *
 * La ruta registrada se reconstruye a partir de su clave canónica y se
 * tokeniza nuevamente para obtener su representación léxica. A partir
 * de ella, la función compara su estructura con la de la ruta actual y
 * genera el conjunto de parámetros capturados durante la coincidencia.
 *
 * @param uri - Clave canónica de la ruta registrada
 *              (`<tipo>-<uri>`), utilizada para identificar de forma
 *              única la definición almacenada por el router.
 *
 * @param tokens - Tokens correspondientes a la ruta actualmente
 *                 navegada, previamente obtenidos por el analizador
 *                 léxico.
 *
 * @returns Un objeto {@link ValidatedRoute}. Si ambas rutas poseen la
 *          misma estructura, `validated` será `true`, `uri`
 *          identificará la ruta registrada que produjo la coincidencia
 *          y `param` contendrá los valores capturados para cada
 *          parámetro. En caso contrario, `validated` será `false` y
 *          `uri` tendrá el valor `null`.
 *
 * @remarks
 * Esta función forma parte del proceso interno de despacho y solo se
 * invoca para rutas clasificadas como parametrizadas. Las rutas
 * estáticas ya han sido resueltas previamente mediante una búsqueda
 * directa sobre la tabla interna del router.
 *
 * La comparación comienza verificando que ambas rutas posean el mismo
 * número de segmentos. Si la longitud difiere, la coincidencia se
 * descarta inmediatamente sin realizar más comprobaciones.
 *
 * Una vez validada la estructura, únicamente los segmentos clasificados
 * como {@link TokenType.Parameter} generan capturas. El nombre del
 * parámetro se obtiene eliminando el prefijo `:` del lexema registrado,
 * mientras que el valor corresponde al lexema presente en la ruta
 * actual.
 *
 * La función no modifica el registro interno del router; únicamente
 * construye la información necesaria para que {@link dispatch} pueda
 * devolver el recurso asociado a la ruta coincidente.
 *
 * @example
 * // Ruta registrada:
 * // /clients/:id/orders/:order
 *
 * // Ruta actual:
 * // /clients/123/orders/100
 *
 * // Resultado:
 * // {
 * //     param: {
 * //         id: '123',
 * //         order: '100'
 * //     },
 * //     uri: '1-/clients/:id/orders/:order',
 * //     validated: true
 * // }
 */
function getValidateRoute(uri: string, tokens: Token[]): ValidatedRoute {
    const currentTokens: Token[] = parsing.getTokensFromURI(uri.substring(2));

    const { length: currentLength } = currentTokens;
    const { length } = tokens;

    const param: Param = {};

    if (length !== currentLength) return {
        param,
        uri: null,
        validated: false
    };

    for (const index in tokens) {
        const token: Token = tokens[index];
        const currentToken: Token = currentTokens[index];

        const currentLexeme: string = currentToken.lexeme.substring(1);
        const lexeme: string = token.lexeme;

        if (currentToken.type !== TokenType.Parameter) continue;
        param[currentLexeme] = lexeme;
    }

    return {
        param,
        uri,
        validated: true
    };
}