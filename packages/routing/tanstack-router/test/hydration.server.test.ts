/** @vitest-environment node */

import { JSDOM } from "jsdom";
import { afterEach, expect, test, vi } from "vitest";

import {
  createMarkoRootRoute,
  createMarkoRoute,
  createMarkoRouteTree,
  createMarkoRouter,
  prepareRouter,
} from "../src/runtime.js";

const createRouteTree = (loader: () => { title: string }) => {
  const root = createMarkoRootRoute(undefined);
  const page = createMarkoRoute({
    parent: root,
    path: "/page",
    component: undefined,
    loader,
  });
  return createMarkoRouteTree(root, [page]);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test("hydrates TanStack loader data without running the initial loader twice", async () => {
  const loader = vi.fn(() => ({ title: "Hydrated page" }));
  const serverRouter = createMarkoRouter(
    createRouteTree(loader),
    "https://example.test/page",
  );

  const { script } = await prepareRouter(serverRouter);
  expect(script).toContain("$_TSR");
  expect(loader).toHaveBeenCalledOnce();

  const dom = new JSDOM(`<!doctype html><script>${script}</script>`, {
    runScripts: "dangerously",
    url: "https://example.test/page",
  });
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("self", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("history", dom.window.history);
  vi.stubGlobal("location", dom.window.location);

  const browserRouter = createMarkoRouter(createRouteTree(loader));
  await prepareRouter(browserRouter);

  expect(loader).toHaveBeenCalledOnce();
  expect(browserRouter.stores.matches.get().at(-1)?.loaderData).toEqual({
    title: "Hydrated page",
  });
});
