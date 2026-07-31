/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import LoaderRoute from "./fixtures/loader-route.marko";

test("renders typed params and loader data from the active route", async () => {
  const result = await render(LoaderRoute, {
    url: new URL("https://example.test/posts/42"),
  });

  expect(result.getByRole("heading", { name: "Post 42" })).toBeTruthy();
  expect(result.getByText("42")).toBeTruthy();
  expect(result.container.textContent).toContain("$_TSR");
});
