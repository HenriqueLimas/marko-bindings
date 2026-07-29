import { fireEvent, render, screen, waitFor } from "@marko/testing-library";
import { createStore } from "@marko-bindings/jotai";
import { atomWithLazy } from "@marko-bindings/jotai/utils";
import { describe, expect, test, vi } from "vitest";

import LetAtom from "./fixtures/let-atom.marko";

describe("atomWithLazy utility", () => {
  test("initializes once for each store that reads the atom", async () => {
    const initialize = vi.fn(() => 1);
    const countAtom = atomWithLazy(initialize);
    const store = createStore();

    expect(initialize).not.toHaveBeenCalled();

    await render(LetAtom, { atom: countAtom, store });

    expect(initialize).toHaveBeenCalledOnce();
    expect(screen.getByText("1")).toBeTruthy();

    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(store.get(countAtom)).toBe(6));
    expect(initialize).toHaveBeenCalledOnce();

    expect(createStore().get(countAtom)).toBe(1);
    expect(initialize).toHaveBeenCalledTimes(2);
  });
});
