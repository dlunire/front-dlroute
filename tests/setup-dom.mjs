/**
 * Mock mínimo de DOM/location para API de base-url + dispatch().
 * No modifica el código del paquete: solo globals del proceso de prueba.
 *
 * @param {object} [opts]
 * @param {string} [opts.origin]
 * @param {string} [opts.basePath]  path de la app en el meta ("" | "/" | "/app")
 * @param {string} [opts.path]      pathname actual del navegador
 * @param {boolean} [opts.withMeta] si false, no hay meta dlroute:base-url
 */

export function installBrowserMocks({
  origin = "https://example.com",
  basePath = "",
  path = "/",
  withMeta = true,
} = {}) {
  class HTMLMetaElement {
    /** @type {string} */
    content = "";
  }

  globalThis.HTMLMetaElement = HTMLMetaElement;

  const normalizeBaseContent = (bp) => {
    if (!bp || bp === "/") return origin;
    const p = bp.startsWith("/") ? bp : `/${bp}`;
    return `${origin}${p}`;
  };

  /** @type {InstanceType<typeof HTMLMetaElement> | null} */
  let meta = null;
  if (withMeta) {
    meta = new HTMLMetaElement();
    meta.content = normalizeBaseContent(basePath);
  }

  globalThis.document = {
    querySelector(selector) {
      if (selector === 'meta[name="dlroute:base-url"]') {
        return meta;
      }
      return null;
    },
  };

  const hrefPath = path.startsWith("/") ? path : `/${path}`;
  globalThis.location = {
    href: `${origin}${hrefPath}`,
  };

  return {
    origin,
    setPath(nextPath) {
      const p = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
      globalThis.location.href = `${origin}${p}`;
    },
    setBase(nextBasePath) {
      if (!meta) {
        meta = new HTMLMetaElement();
      }
      meta.content = normalizeBaseContent(nextBasePath);
    },
    removeMeta() {
      meta = null;
    },
  };
}

/** Silencia console.log del paquete (p. ej. determineRoute) durante un test. */
export function silenceConsoleLog() {
  const original = console.log;
  console.log = () => {};
  return () => {
    console.log = original;
  };
}
