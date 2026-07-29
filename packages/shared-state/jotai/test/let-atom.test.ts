import { fireEvent, render, screen, waitFor } from "@marko/testing-library";
import { atom, createStore } from "@marko-bindings/jotai";
import { describe, expect, test, vi } from "vitest";

import ConditionalLetAtom from "./fixtures/conditional-let-atom.marko";
import DefaultStore from "./fixtures/default-store.marko";
import LetAtom from "./fixtures/let-atom.marko";

describe("let-atom tag", () => {
  test("uses the default store when one is not provided", async () => {
    await render(DefaultStore);

    expect(screen.getByText("2")).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Increment" }));

    await waitFor(() => expect(screen.getByText("3")).toBeTruthy());
  });

  test("returns the atom value and reacts to store updates", async () => {
    const countAtom = atom(1);
    const store = createStore();

    await render(LetAtom, { atom: countAtom, store });
    expect(screen.getByText("1")).toBeTruthy();

    store.set(countAtom, 2);

    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });

  test("writes assignments back to the atom", async () => {
    const countAtom = atom(1);
    const store = createStore();

    await render(LetAtom, { atom: countAtom, store });
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(store.get(countAtom)).toBe(6));
    expect(screen.getByText("6")).toBeTruthy();
  });

  test("unsubscribes when the tag is removed", async () => {
    const unsubscribe = vi.fn();
    const countAtom = atom(1);
    countAtom.onMount = () => unsubscribe;
    const store = createStore();

    const result = await render(ConditionalLetAtom, {
      atom: countAtom,
      show: true,
      store,
    });
    await result.rerender({ atom: countAtom, show: false, store });

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
