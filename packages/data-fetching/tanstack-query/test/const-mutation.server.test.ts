/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import ConstMutationServer from "./fixtures/const-mutation-server.marko";

test("renders idle state without resolving mutation dependencies during SSR", async () => {
  const result = await render(ConstMutationServer);

  expect(result.getByText("idle")).toBeTruthy();
});
