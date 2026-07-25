import { fireEvent, render, screen, waitFor } from "@marko/testing-library";
import { atom, createStore } from "marko-jotai";
import { describe, expect, test, vi } from "vitest";

import { deferred } from "./deferred";
import AsyncWritableAtom from "./fixtures/async-writable-atom.marko";
import ConditionalUseAtom from "./fixtures/conditional-use-atom.marko";
import DefaultStore from "./fixtures/default-store.marko";
import UseAtom from "./fixtures/use-atom.marko";

describe("use-atom tag", () => {
  test("resolves async writable atoms through a body parameter", async () => {
    const value = deferred<number>();
    const asyncAtom = atom(value.promise);
    const store = createStore();
    await render(AsyncWritableAtom, { atom: asyncAtom, store });

    expect(await screen.findByText("Loading...")).toBeTruthy();

    value.resolve(42);

    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());

    const nextValue = deferred<number>();
    store.set(asyncAtom, nextValue.promise);

    expect(await screen.findByText("Loading...")).toBeTruthy();

    nextValue.resolve(43);

    await waitFor(() => expect(screen.getByText("43")).toBeTruthy());
  });

  test("uses the default store when one is not provided", async () => {
    await render(DefaultStore);

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
