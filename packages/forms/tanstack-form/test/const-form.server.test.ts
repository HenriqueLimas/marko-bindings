/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import ServerForm from "./fixtures/server-form.marko";

test("renders field defaults and serializes imported validators during SSR", async () => {
  const result = await render(ServerForm);

  expect(result.getByRole("textbox").getAttribute("value")).toBe("Ada");
  expect(result.getByText("Ada")).toBeTruthy();
});
