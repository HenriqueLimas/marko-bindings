/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import ManualRoutes from "./fixtures/manual-routes.marko";

test("renders the matched child inside its root route outlet", async () => {
  const result = await render(ManualRoutes, {
    url: new URL("https://example.test/about"),
  });

  expect(result.getByText("Root layout")).toBeTruthy();
  expect(result.getByText("About page")).toBeTruthy();
  expect(result.queryByText("Home page")).toBeNull();
});
