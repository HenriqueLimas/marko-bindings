import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRouterResponse,
  createRequestUrl,
  renderRouterApplication,
} from "../server-utils.mjs";

test("keeps request URLs on the configured application origin", () => {
  const origin = "https://app.example";

  assert.equal(
    createRequestUrl("/query?value=one", origin).href,
    "https://app.example/query?value=one",
  );
  assert.equal(
    createRequestUrl("http://attacker.example/api/books", origin).href,
    "https://app.example/api/books",
  );
  assert.equal(
    createRequestUrl("//attacker.example/api/books", origin).href,
    "https://app.example/api/books",
  );
});

test("streams the application with the prepared router response", async () => {
  const chunks = [];
  const headers = new Map();
  const response = {
    statusCode: 0,
    setHeader(name, value) {
      headers.set(name, value);
    },
    write(chunk) {
      chunks.push(chunk);
    },
    end() {
      this.ended = true;
    },
  };
  const template = {
    async *render(input) {
      yield "head";
      input.onServerPrepared({
        statusCode: 404,
        headers: [["x-route", "missing"]],
        redirect: false,
      });
      yield "body";
    },
  };

  await renderRouterApplication(
    template,
    new URL("https://app.test/missing"),
    response,
  );

  assert.equal(response.statusCode, 404);
  assert.equal(headers.get("x-route"), "missing");
  assert.deepEqual(chunks, ["head", "body"]);
  assert.equal(response.ended, true);
});

test("applies the prepared router status and headers", () => {
  const headers = new Map();
  const response = {
    statusCode: 0,
    setHeader(name, value) {
      headers.set(name, value);
    },
  };

  applyRouterResponse(response, {
    statusCode: 404,
    headers: [
      ["content-type", "text/html; charset=utf-8"],
      ["x-route", "missing"],
    ],
    redirect: false,
  });

  assert.equal(response.statusCode, 404);
  assert.equal(headers.get("x-route"), "missing");
});
