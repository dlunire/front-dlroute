/**
 * Batería — base-url.ts (meta, ruta relativa, asset)
 *
 * Ejecutar: node --test tests/base-url.test.mjs
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getRoute,
  getBaseURL,
  asset,
  route,
  dispatch,
  resetState,
} from "../dist/index.js";
import { installBrowserMocks, silenceConsoleLog } from "./setup-dom.mjs";

/** @type {ReturnType<typeof installBrowserMocks>} */
let browser;
/** @type {() => void} */
let restoreLog;

beforeEach(() => {
  restoreLog = silenceConsoleLog();
  resetState();
});

afterEach(() => {
  resetState();
  restoreLog();
});

describe("base-url — getRoute (ruta relativa)", () => {
  it("meta en origen + path /users/10 → uri /users/10", () => {
    browser = installBrowserMocks({
      origin: "http://localhost:5173",
      basePath: "",
      path: "/users/10",
    });
    const r = getRoute();
    assert.equal(r.uri, "/users/10");
    assert.deepEqual(
      r.tokens.map((t) => t.lexeme),
      ["users", "10"],
    );
  });

  it("app montada en /app: meta /app + location /app/users/10 → /users/10", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      basePath: "/app",
      path: "/app/users/10",
    });
    const r = getRoute();
    assert.equal(r.uri, "/users/10");
  });

  it("dispatch con base /app resuelve param", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      basePath: "/app",
      path: "/app/users/10",
    });
    const C = { name: "User" };
    route("/users/:id", C);
    const d = dispatch();
    assert.equal(d.validated.validated, true);
    assert.equal(d.component, C);
    assert.deepEqual(d.validated.param, { id: "10" });
  });

  it("CONTRATO bajo base /app: /app/posts/99 no matchea /users/:id", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      basePath: "/app",
      path: "/app/posts/99",
    });
    route("/users/:id", { name: "User" });
    const d = dispatch();
    assert.equal(d.validated.validated, false);
    assert.equal(d.component, null);
  });
});

describe("base-url — getBaseURL y asset", () => {
  it("getBaseURL con meta devuelve origin(+base) sin slash final", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      basePath: "/app",
      path: "/app/",
    });
    assert.equal(getBaseURL(), "https://example.com/app");
  });

  it("getBaseURL sin meta usa location normalizada", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      path: "/foo//bar",
      withMeta: false,
    });
    // sin meta → default = getURLFromURL() sobre location
    const base = getBaseURL();
    assert.equal(base, "https://example.com/foo/bar");
  });

  it("asset concatena base + URI canónica", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      basePath: "",
      path: "/",
    });
    assert.equal(asset("/img//logo.png"), "https://example.com/img/logo.png");
  });
});

describe("base-url — getRoute sin meta", () => {
  it("sin meta dlroute:base-url, getRoute lanza (getCanonicalURI interno)", () => {
    browser = installBrowserMocks({
      path: "/users",
      withMeta: false,
    });
    assert.throws(() => getRoute(), /dlroute:base-url|meta/i);
  });
});

describe("base-url — fallback sin location", () => {
  /**
   * determineRoute: si no hay location/href, currentURI = "/" (no https://dlunire.dev).
   * El meta sigue siendo obligatorio vía getCanonicalURI.
   */

  it("sin globalThis.location y meta en origen → uri '/' y tokens vacíos", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      basePath: "",
      path: "/users/10",
    });

    const previous = globalThis.location;
    // @ts-expect-error — simular entorno sin location (SSR / worker)
    delete globalThis.location;

    try {
      const r = getRoute();
      assert.equal(r.uri, "/");
      assert.deepEqual(
        r.tokens.map((t) => t.lexeme),
        [],
      );
      assert.equal(JSON.stringify(r).includes("dlunire.dev"), false);
    } finally {
      globalThis.location = previous;
    }
  });

  it("location sin href → mismo fallback '/' (no dominio del framework)", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      basePath: "",
      path: "/anything",
    });

    globalThis.location = /** @type {Location} */ ({});

    const r = getRoute();
    assert.equal(r.uri, "/");
    assert.equal(JSON.stringify(r).includes("dlunire.dev"), false);
  });

  it("location.href null → fallback '/'", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      basePath: "",
      path: "/x",
    });

    globalThis.location = { href: /** @type {any} */ (null) };

    const r = getRoute();
    assert.equal(r.uri, "/");
  });

  it("sin location y meta bajo /app → uri relativa neutra '/' (no inventa host)", () => {
    browser = installBrowserMocks({
      origin: "https://example.com",
      basePath: "/app",
      path: "/app/users/10",
    });

    const previous = globalThis.location;
    // @ts-expect-error
    delete globalThis.location;

    try {
      const r = getRoute();
      // currentURI="/" vs base "/app" → resto neutro "/", sin https://dlunire.dev
      assert.equal(r.uri, "/");
      assert.equal(JSON.stringify(r).includes("dlunire.dev"), false);
    } finally {
      globalThis.location = previous;
    }
  });
});
