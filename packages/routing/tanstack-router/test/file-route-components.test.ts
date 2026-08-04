import { fireEvent, render, screen } from "@marko/testing-library";
import { expect, test } from "vitest";

import FileRouteComponents from "./fixtures/file-route-components.marko";
import { resolveSlowLoader } from "./fixtures/file-route-tree.js";

test("renders a pending component while a route loader settles", async () => {
  window.history.replaceState(null, "", "/about");
  await render(FileRouteComponents, {
    url: new URL(window.location.href),
  });

  await fireEvent.click(
    await screen.findByRole("link", { name: "Slow route" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Loading slow route" }),
  ).toBeTruthy();

  resolveSlowLoader();
  expect(
    await screen.findByRole("heading", { name: "Slow route loaded" }),
  ).toBeTruthy();
});

test("loads a .component.marko route in the browser target", async () => {
  window.history.replaceState(null, "", "/about");

  await render(FileRouteComponents, {
    url: new URL(window.location.href),
  });

  expect(
    await screen.findByRole("heading", { name: "Lazy file route" }),
  ).toBeTruthy();
});
