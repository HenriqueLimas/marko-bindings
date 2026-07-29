/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import AwaitQueryServer from "./fixtures/await-query-server.marko";

test("awaits and renders a query with a server client", async () => {
  const result = await render(AwaitQueryServer);

  expect(result.getByText("Hello from the server")).toBeTruthy();
});
