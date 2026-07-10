/**
 * Batería — router.ts (registro + dispatch)
 *
 * Contrato acotado:
 *   /users/:id + URL /posts/99 → NO match
 *
 * Ejecutar: node --test tests/router.test.mjs
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  route,
  dispatch,
  resetState,
  getRoutes,
  TokenType,
} from "../dist/index.js";
import { installBrowserMocks, silenceConsoleLog } from "./setup-dom.mjs";

const C_USERS = { id: "Users" };
const C_USER_ID = { id: "UserById" };
const C_USER_99 = { id: "User99Static" };
const C_CLIENTS = { id: "ClientsOrders" };
const C_ROOT = { id: "Root" };
const C_ONLY_ID = { id: "OnlyId" };

/** @type {ReturnType<typeof installBrowserMocks>} */
let browser;
/** @type {() => void} */
let restoreLog;

beforeEach(() => {
  restoreLog = silenceConsoleLog();
  resetState();
  browser = installBrowserMocks({ path: "/" });
});

afterEach(() => {
  resetState();
  restoreLog();
});

describe("router — registro", () => {
  it("estática → clave 0-; dinámica → clave 1-", () => {
    route("/users", C_USERS);
    route("/users/:id", C_USER_ID);
    assert.deepEqual(Object.keys(getRoutes()).sort(), [
      "0-/users",
      "1-/users/:id",
    ]);
    assert.equal(getRoutes()["0-/users"].type, TokenType.Static);
    assert.equal(getRoutes()["1-/users/:id"].type, TokenType.Parameter);
    assert.equal(getRoutes()["0-/users"].component, C_USERS);
  });

  it("route('/users/99') es estática, no dinámica", () => {
    route("/users/99", C_USER_99);
    assert.ok(getRoutes()["0-/users/99"]);
    assert.equal(getRoutes()["0-/users/99"].type, TokenType.Static);
    assert.equal(getRoutes()["1-/users/99"], undefined);
  });

  it("normaliza al registrar", () => {
    route("/users//profile/", C_USERS);
    assert.ok(getRoutes()["0-/users/profile"]);
  });

  it("resetState vacía solo la tabla del router", () => {
    route("/users", C_USERS);
    resetState();
    assert.deepEqual(getRoutes(), {});
  });

  it("getRoutes expone la misma referencia interna", () => {
    route("/users", C_USERS);
    const table = getRoutes();
    delete table["0-/users"];
    assert.equal(getRoutes()["0-/users"], undefined);
  });

  it("re-registrar la misma URI sobrescribe component", () => {
    route("/users", C_USERS);
    route("/users", C_ROOT);
    assert.equal(getRoutes()["0-/users"].component, C_ROOT);
  });

  it("':' vacío en registro lanza", () => {
    assert.throws(() => route("/users/:", C_USERS), /parámetro|carácter|:/i);
  });
});

describe("router — dispatch estático (cajón 0)", () => {
  it("match exacto O(1), sin params", () => {
    route("/users", C_USERS);
    browser.setPath("/users");
    const r = dispatch();
    assert.equal(r.validated.validated, true);
    assert.equal(r.component, C_USERS);
    assert.deepEqual(r.validated.param, {});
    assert.equal(r.validated.uri, "0-/users");
  });

  it("route('/users/99') matchea URL /users/99 como estática", () => {
    route("/users/99", C_USER_99);
    browser.setPath("/users/99");
    const r = dispatch();
    assert.equal(r.component, C_USER_99);
    assert.equal(r.validated.uri, "0-/users/99");
  });

  it("'//' en location se normaliza y puede resolver estática", () => {
    route("/users", C_USERS);
    browser.setPath("/users//");
    const r = dispatch();
    assert.equal(r.validated.validated, true);
    assert.equal(r.component, C_USERS);
    assert.equal(r.validated.uri, "0-/users");
  });

  it("raíz '/'", () => {
    route("/", C_ROOT);
    browser.setPath("/");
    const r = dispatch();
    assert.equal(r.component, C_ROOT);
  });
});

describe("router — dispatch param (cajón 1)", () => {
  beforeEach(() => {
    route("/users/:id", C_USER_ID);
    route("/clients/:id/orders/:order", C_CLIENTS);
  });

  it("match correcto: /users/:id + /users/99", () => {
    browser.setPath("/users/99");
    const r = dispatch();
    assert.equal(r.validated.validated, true);
    assert.equal(r.component, C_USER_ID);
    assert.deepEqual(r.validated.param, { id: "99" });
    assert.equal(r.validated.uri, "1-/users/:id");
  });

  it("CONTRATO: /users/:id + /posts/99 → NO match", () => {
    browser.setPath("/posts/99");
    const r = dispatch();
    assert.equal(r.validated.validated, false);
    assert.equal(r.component, null);
    assert.equal(r.validated.uri, null);
    assert.deepEqual(r.validated.param, {});
  });

  it("CONTRATO: literales intermedios — /shops/1/orders/2 no matchea /clients/:id/orders/:order", () => {
    browser.setPath("/shops/1/orders/2");
    const r = dispatch();
    assert.equal(r.validated.validated, false);
    assert.equal(r.component, null);
  });

  it("match multi-param: /clients/1/orders/2", () => {
    browser.setPath("/clients/1/orders/2");
    const r = dispatch();
    assert.equal(r.validated.validated, true);
    assert.equal(r.component, C_CLIENTS);
    assert.deepEqual(r.validated.param, { id: "1", order: "2" });
  });

  it("distinta aridad → 404", () => {
    browser.setPath("/users/99/extra");
    const r = dispatch();
    assert.equal(r.validated.validated, false);
    assert.equal(r.component, null);
  });

  it("solo-param /:id + /42", () => {
    resetState();
    route("/:id", C_ONLY_ID);
    browser.setPath("/42");
    const r = dispatch();
    assert.equal(r.validated.validated, true);
    assert.equal(r.component, C_ONLY_ID);
    assert.deepEqual(r.validated.param, { id: "42" });
  });
});

describe("router — prioridad estática sobre param", () => {
  it("/users exacta gana aunque exista /users/:id", () => {
    route("/users/:id", C_USER_ID);
    route("/users", C_USERS);
    browser.setPath("/users");
    const r = dispatch();
    assert.equal(r.component, C_USERS);
    assert.equal(r.validated.uri, "0-/users");
  });

  it("/users/5 usa param", () => {
    route("/users/:id", C_USER_ID);
    route("/users", C_USERS);
    browser.setPath("/users/5");
    const r = dispatch();
    assert.equal(r.component, C_USER_ID);
    assert.deepEqual(r.validated.param, { id: "5" });
  });

  it("estática /users/99 gana sobre /users/:id para esa URL", () => {
    route("/users/:id", C_USER_ID);
    route("/users/99", C_USER_99);
    browser.setPath("/users/99");
    const r = dispatch();
    assert.equal(r.component, C_USER_99);
    assert.equal(r.validated.uri, "0-/users/99");
    assert.deepEqual(r.validated.param, {});
  });
});

describe("router — 404 y query en location", () => {
  it("sin rutas → 404", () => {
    browser.setPath("/anything");
    const r = dispatch();
    assert.equal(r.validated.validated, false);
    assert.equal(r.component, null);
  });

  it("query en href no impide match estático del path", () => {
    route("/users", C_USERS);
    // setPath no soporta query; se asigna href completo
    globalThis.location.href = `${browser.origin}/users?tab=1`;
    const r = dispatch();
    assert.equal(r.validated.validated, true);
    assert.equal(r.component, C_USERS);
  });
});

describe("router — competencia entre params misma aridad", () => {
  it("primer patrón 1- que valide gana (orden de claves del objeto)", () => {
    route("/users/:id", C_USER_ID);
    route("/posts/:id", { id: "Posts" });
    browser.setPath("/users/1");
    const r = dispatch();
    assert.equal(r.validated.validated, true);
    assert.equal(r.component, C_USER_ID);

    browser.setPath("/posts/1");
    const r2 = dispatch();
    assert.equal(r2.validated.validated, true);
    assert.equal(r2.component.id, "Posts");
  });
});
