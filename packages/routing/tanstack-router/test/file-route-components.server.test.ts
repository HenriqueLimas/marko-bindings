/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import FileRouteComponents from "./fixtures/file-route-components.marko";

test("renders a lazily imported .component.marko route", async () => {
  const result = await render(FileRouteComponents, {
    url: new URL("https://example.test/about"),
  });

  expect(result.getByRole("heading", { name: "File routes" })).toBeTruthy();
  expect(result.getByRole("heading", { name: "Lazy file route" })).toBeTruthy();
});

test("renders the root not-found component inside the root layout", async () => {
  const result = await render(FileRouteComponents, {
    url: new URL("https://example.test/does-not-exist"),
  });

  expect(result.getByRole("heading", { name: "File routes" })).toBeTruthy();
  expect(result.getByRole("heading", { name: "Page not found" })).toBeTruthy();
});

test("renders a lazily imported .notFoundComponent.marko route", async () => {
  const result = await render(FileRouteComponents, {
    url: new URL("https://example.test/missing"),
  });

  expect(result.getByRole("heading", { name: "File routes" })).toBeTruthy();
  expect(result.getByRole("heading", { name: "Route not found" })).toBeTruthy();
  expect(result.getByText("Missing loader data")).toBeTruthy();
});

test("renders a lazily imported .errorComponent.marko route", async () => {
  const result = await render(FileRouteComponents, {
    url: new URL("https://example.test/broken"),
  });

  expect(result.getByRole("heading", { name: "Route failed" })).toBeTruthy();
  expect(result.getByText("Broken loader")).toBeTruthy();
});
