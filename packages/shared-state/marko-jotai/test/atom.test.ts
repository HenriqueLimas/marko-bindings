import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@marko/testing-library";
import { atom, createStore } from "marko-jotai";
import { afterEach, describe, expect, test, vi } from "vitest";

import AtomWithStorage from "./fixtures/atom-with-storage.marko";
import ConditionalUseAtom from "./fixtures/conditional-use-atom.marko";
import ConstStore from "./fixtures/const-store.marko";
import UseAtom from "./fixtures/use-atom.marko";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("use-atom tag", () => {
  test("uses a store created in a const tag", async () => {
    await render(ConstStore);

    expect(screen.getByText("2")).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Increment" }));

    await waitFor(() => expect(screen.getByText("3")).toBeTruthy());
  });

  test("returns the atom value and reacts to store updates", async () => {
    const countAtom = atom(1);
    const store = createStore();

    await render(UseAtom, { atom: countAtom, store });
    expect(screen.getByText("1")).toBeTruthy();

    store.set(countAtom, 2);

    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });

  test("writes assignments back to the atom", async () => {
    const countAtom = atom(1);
    const store = createStore();

    await render(UseAtom, { atom: countAtom, store });
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(store.get(countAtom)).toBe(6));
    expect(screen.getByText("6")).toBeTruthy();
  });

  test("supports atomWithStorage atoms", async () => {
    await render(AtomWithStorage);
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(screen.getByText("6")).toBeTruthy());
    expect(localStorage.getItem("marko-jotai-count")).toBe("6");
  });

  test("unsubscribes when the tag is removed", async () => {
    const unsubscribe = vi.fn();
    const countAtom = atom(1);
    countAtom.onMount = () => unsubscribe;
    const store = createStore();

    const result = await render(ConditionalUseAtom, {
      atom: countAtom,
      show: true,
      store,
    });
    await result.rerender({ atom: countAtom, show: false, store });

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
