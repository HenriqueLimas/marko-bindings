/** @vitest-environment node */

import { render } from "@marko/testing-library";
import { expect, test } from "vitest";

import ArrayForm from "./fixtures/array-form.marko";
import ServerForm from "./fixtures/server-form.marko";

test("renders field defaults and serializes imported validators during SSR", async () => {
  const result = await render(ServerForm);

  expect(result.getByRole("textbox").getAttribute("value")).toBe("Ada");
  expect(result.getByText("Ada")).toBeTruthy();
});

test("renders array fields during SSR", async () => {
  const result = await render(ArrayForm);

  expect(
    result.getByRole("textbox", { name: "Person 1" }).getAttribute("value"),
  ).toBe("Ada");
  expect(
    result.getByRole("textbox", { name: "Person 2" }).getAttribute("value"),
  ).toBe("Grace");
});
