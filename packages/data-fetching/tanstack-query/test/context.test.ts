import {
  QueryClient,
  getClientContext,
  setClientContext,
} from "@marko-bindings/tanstack-query";
import { expect, test } from "vitest";

test("shares a query client through a symbol-keyed render context", () => {
  const global = {};
  const client = new QueryClient();

  expect(setClientContext(global, client)).toBe(client);
  expect(getClientContext(global)).toBe(client);
  expect(Object.keys(global)).toEqual([]);
});
