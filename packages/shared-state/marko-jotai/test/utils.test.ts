import * as jotaiUtils from "jotai/vanilla/utils";
import * as markoJotaiUtils from "marko-jotai/utils";
import { expect, test } from "vitest";

test("re-exports the complete Jotai vanilla utilities entrypoint", () => {
  expect(Object.keys(markoJotaiUtils).sort()).toEqual(
    Object.keys(jotaiUtils).sort(),
  );
});
