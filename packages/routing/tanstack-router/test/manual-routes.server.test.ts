/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test, vi } from "vitest";

import ManualRoutes from "./fixtures/manual-routes.marko";

test("reports the prepared server response to the renderer", async () => {
  const onServerPrepared = vi.fn();

  await render(ManualRoutes, {
    url: new URL("https://example.test/about"),
    onServerPrepared,
  });

  expect(onServerPrepared).toHaveBeenCalledWith(
    expect.objectContaining({ statusCode: 200, redirect: false }),
  );
});

test("renders the matched child as its root route body content", async () => {
  const result = await render(ManualRoutes, {
    url: new URL("https://example.test/about"),
  });

  expect(result.getByText("Root layout")).toBeTruthy();
  expect(result.getByText("About page")).toBeTruthy();
  expect(result.queryByText("Home page")).toBeNull();
});
