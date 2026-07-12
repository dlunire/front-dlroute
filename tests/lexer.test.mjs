/**
 * Batería — lexer.ts (analizador léxico / autómata de path)
 *
 * Tokenización carácter a carácter: sin RegExp en el motor.
 * Ejecutar: node --test tests/lexer.test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getTokensFromURI,
  getURIFromURI,
  getCanonicalURI,
  getTokensFromURL,
  getURIFromURL,
  getURLFromURL,
  parseRoute,
  TokenType,
} from "../dist/index.js";

function lexemes(uri) {
  return getTokensFromURI(uri).map((t) => t.lexeme);
}

function types(uri) {
  return getTokensFromURI(uri).map((t) => t.type);
}

describe("lexer — raíz y vacíos", () => {
  it("'' y '/' → canónica '/' y cero tokens", () => {
    assert.equal(getURIFromURI(""), "/");
    assert.equal(getURIFromURI("/"), "/");
    assert.deepEqual(getTokensFromURI(""), []);
    assert.deepEqual(getTokensFromURI("/"), []);
  });
});

describe("lexer — normalización de path", () => {
  it("colapsa '//'", () => {
    assert.equal(getURIFromURI("/users//123"), "/users/123");
    assert.deepEqual(lexemes("/users//123"), ["users", "123"]);
  });

  it("colapsa múltiples barras y trailing slash", () => {
    assert.equal(getURIFromURI("/users////123///"), "/users/123");
    assert.equal(getURIFromURI("/users/"), "/users");
  });

  it("descarta query string en '?'", () => {
    assert.equal(getURIFromURI("/users/123?x=1&y=2"), "/users/123");
    assert.deepEqual(lexemes("/users/123?token=abc"), ["users", "123"]);
  });

  it("espacios dentro de un segmento → '_'", () => {
    assert.equal(getURIFromURI("/pro duc tos"), "/pro_duc_tos");
    assert.equal(lexemes("/pro duc tos").length, 1);
    assert.equal(lexemes("/pro duc tos")[0], "pro_duc_tos");
  });

  it("espacio junto a '/' puede partir segmentos", () => {
    assert.equal(
      getURIFromURI("/ciencias//de/la / computación"),
      "/ciencias/de/la_/_computación",
    );
    assert.deepEqual(lexemes("/ciencias//de/la / computación"), [
      "ciencias",
      "de",
      "la_",
      "_computación",
    ]);
  });

  it("caracteres especiales en segmentos se conservan", () => {
    assert.equal(getURIFromURI("/a+b/c.d/~e"), "/a+b/c.d/~e");
    assert.deepEqual(lexemes("/a+b/c.d/~e"), ["a+b", "c.d", "~e"]);
  });
});

describe("lexer — Static vs Parameter", () => {
  it("segmentos literales son Static", () => {
    assert.deepEqual(types("/users/profile"), [
      TokenType.Static,
      TokenType.Static,
    ]);
  });

  it("':id' es Parameter; 'users' es Static", () => {
    assert.deepEqual(types("/users/:id"), [
      TokenType.Static,
      TokenType.Parameter,
    ]);
    assert.deepEqual(lexemes("/users/:id"), ["users", ":id"]);
  });

  it("ruta solo-param '/:id'", () => {
    assert.deepEqual(types("/:id"), [TokenType.Parameter]);
    assert.equal(getURIFromURI("/:id"), "/:id");
  });

  it("parámetro sin nombre ':' lanza Error", () => {
    assert.throws(() => getTokensFromURI("/users/:"), /parámetro|carácter|:/i);
    assert.throws(() => getURIFromURI("://bad"), /parámetro|carácter|:/i);
    assert.throws(() => parseRoute("/:"), /parámetro|carácter|:/i);
  });
});

describe("lexer — snapshots e independencia de estado", () => {
  it("getTokensFromURI devuelve array distinto del buffer interno", () => {
    const a = getTokensFromURI("/a/b");
    const b = getTokensFromURI("/c");
    assert.notEqual(a, b);
    assert.deepEqual(
      a.map((t) => t.lexeme),
      ["a", "b"],
    );
    assert.deepEqual(
      b.map((t) => t.lexeme),
      ["c"],
    );
  });

  it("getCanonicalURI refleja el último análisis (stateful)", () => {
    getTokensFromURI("/one/two");
    assert.equal(getCanonicalURI(), "/one/two");
    getTokensFromURI("/only");
    assert.equal(getCanonicalURI(), "/only");
  });

  it("parseRoute.tokens no se corrompe con un análisis posterior", () => {
    const r = parseRoute("/x/:id");
    getTokensFromURI("/other/path");
    assert.deepEqual(
      r.tokens.map((t) => t.lexeme),
      ["x", ":id"],
    );
    assert.equal(r.uri, "/x/:id");
    assert.equal(r.type, TokenType.Parameter);
  });
});

describe("lexer — parseRoute", () => {
  it("sin ':' → type Static", () => {
    const r = parseRoute("/users/profile");
    assert.equal(r.type, TokenType.Static);
    assert.equal(r.uri, "/users/profile");
  });

  it("con al menos un ':' → type Parameter", () => {
    const r = parseRoute("/users/:id/profile");
    assert.equal(r.type, TokenType.Parameter);
    assert.equal(r.uri, "/users/:id/profile");
  });

  it("normaliza al parsear", () => {
    const r = parseRoute("/users//:id/");
    assert.equal(r.uri, "/users/:id");
    assert.equal(r.type, TokenType.Parameter);
  });
});

describe("lexer — URL absolutas", () => {
  it("getURIFromURL usa solo pathname y normaliza", () => {
    assert.equal(
      getURIFromURL("https://api.example.com//users//123/?q=1"),
      "/users/123",
    );
  });

  it("getTokensFromURL tokeniza el pathname", () => {
    assert.deepEqual(
      getTokensFromURL("https://api.example.com/users/:id").map((t) => t.lexeme),
      ["users", ":id"],
    );
  });

  it("getURLFromURL conserva origin y pathname canónico; descarta search", () => {
    const url = getURLFromURL("https://example.com//users//1?x=1");
    assert.equal(url.origin, "https://example.com");
    assert.equal(url.pathname, "/users/1");
    assert.equal(url.search, "");
  });

  it("getURLFromURL() utiliza la URL del entorno cuando no se proporciona una URL", () => {
    const prev = globalThis.location;
    globalThis.location = { href: "https://app.test/foo//bar" };

    try {
      const url = getURLFromURL();

      assert.equal(url.origin, "https://app.test");
      assert.equal(url.pathname, "/foo/bar");
    } finally {
      globalThis.location = prev;
    }
  });

  it("getURLFromURL('') lanza TypeError", () => {
    assert.throws(
      () => getURLFromURL(""),
      TypeError,
    );
  });
});
