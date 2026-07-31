/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import ConstQueryServer from "./fixtures/const-query-server.marko";
import {
  finishPendingGreeting,
  hasPendingGreeting,
} from "./fixtures/server-query.js";

test("streams a pending server query promise without awaiting its markup", async () => {
  let didFinishRendering = false;
  const rendering = render(ConstQueryServer).then((result) => {
    didFinishRendering = true;
    return result;
  });

  for (let attempt = 0; attempt < 20 && !hasPendingGreeting(); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  expect(hasPendingGreeting()).toBe(true);
  expect(didFinishRendering).toBe(false);
  finishPendingGreeting();

  const result = await rendering;
  expect(result.getByText("pending:fetching")).toBeTruthy();
});
