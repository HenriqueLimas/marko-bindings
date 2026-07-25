import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@marko/testing-library";
import { atom, createStore, getDefaultStore } from "marko-jotai";
import { atomWithLazy } from "marko-jotai/utils";
import { afterEach, describe, expect, test, vi } from "vitest";

import AsyncAtom from "./fixtures/async-atom.marko";
import AsyncWritableAtom from "./fixtures/async-writable-atom.marko";
import AtomWithStorage from "./fixtures/atom-with-storage.marko";
import ConditionalUseAtom from "./fixtures/conditional-use-atom.marko";
import DefaultStore from "./fixtures/default-store.marko";
import UseAtom from "./fixtures/use-atom.marko";
import UseAtomValue from "./fixtures/use-atom-value.marko";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

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

  test("supports atomWithStorage atoms", async () => {
    await render(AtomWithStorage);
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(screen.getByText("6")).toBeTruthy());
    expect(localStorage.getItem("marko-jotai-count")).toBe("6");
  });

  test("supports lazily initialized atoms", async () => {
    const initialize = vi.fn(() => 1);
    const countAtom = atomWithLazy(initialize);
    const store = createStore();

    expect(initialize).not.toHaveBeenCalled();

    await render(UseAtom, { atom: countAtom, store });

    expect(initialize).toHaveBeenCalledOnce();
    expect(screen.getByText("1")).toBeTruthy();

    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(store.get(countAtom)).toBe(6));
    expect(initialize).toHaveBeenCalledOnce();

    expect(createStore().get(countAtom)).toBe(1);
    expect(initialize).toHaveBeenCalledTimes(2);
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

describe("use-atom-value tag", () => {
  test("returns a reactive read-only atom value", async () => {
    const sourceAtom = atom(1);
    const readableAtom = atom((get) => get(sourceAtom));
    const store = createStore();

    await render(UseAtomValue, { atom: readableAtom, store });
    expect(screen.getByText("1")).toBeTruthy();

    store.set(sourceAtom, 2);

    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });

  test("supports async atoms with a try placeholder", async () => {
    const value = deferred<number>();
    const sourceAtom = atom(value.promise);
    const asyncAtom = atom((get) => get(sourceAtom));
    const store = getDefaultStore();
    await render(AsyncAtom, { atom: asyncAtom });

    expect(await screen.findByText("Loading...")).toBeTruthy();

    value.resolve(42);

    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());

    const nextValue = deferred<number>();
    store.set(sourceAtom, nextValue.promise);

    expect(await screen.findByText("Loading...")).toBeTruthy();

    nextValue.resolve(43);

    await waitFor(() => expect(screen.getByText("43")).toBeTruthy());
  });

  test("catches rejected async atoms", async () => {
    const value = deferred<number>();
    const asyncAtom = atom(() => value.promise);
    await render(AsyncAtom, { atom: asyncAtom, store: createStore() });
    await screen.findByText("Loading...");

    value.reject(new Error("No number"));

    expect(await screen.findByText("Error: No number")).toBeTruthy();
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}
