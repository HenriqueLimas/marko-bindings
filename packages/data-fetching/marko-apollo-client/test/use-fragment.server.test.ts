/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import UseFragmentServer from "./fixtures/use-fragment-server.marko";

test("renders a fragment from the server client cache", async () => {
  const result = await render(UseFragmentServer);

  expect(result.getByText("Buck")).toBeTruthy();
  expect(result.getByText("Complete")).toBeTruthy();
});
