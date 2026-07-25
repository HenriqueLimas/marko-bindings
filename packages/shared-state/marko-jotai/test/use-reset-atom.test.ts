import { fireEvent, render, screen, waitFor } from "@marko/testing-library";
import { createStore } from "marko-jotai";
import { describe, expect, test } from "vitest";

import ResetAtom from "./fixtures/reset-atom.marko";

describe("use-reset-atom tag", () => {
  test.each([
    ["the default store", undefined],
    ["an explicit store", createStore()],
  ])("resets an atom using %s", async (_name, store) => {
    await render(ResetAtom, { store });
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));
    await waitFor(() => expect(screen.getByText("6")).toBeTruthy());

    await fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => expect(screen.getByText("1")).toBeTruthy());
  });
});
