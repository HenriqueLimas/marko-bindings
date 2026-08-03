import { render, screen } from "@marko/testing-library";
import { expect, test } from "vitest";

import FileRouteComponents from "./fixtures/file-route-components.marko";

test("loads a .component.marko route in the browser target", async () => {
  window.history.replaceState(null, "", "/about");

  await render(FileRouteComponents, {
    url: new URL(window.location.href),
  });

  expect(
    await screen.findByRole("heading", { name: "Lazy file route" }),
  ).toBeTruthy();
});
