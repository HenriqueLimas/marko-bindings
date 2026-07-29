/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import UseQueryServer from "./fixtures/use-query-server.marko";

test("awaits and renders a query with a server client", async () => {
  const result = await render(UseQueryServer);

  expect(result.getByText("Hello from the server")).toBeTruthy();
});
