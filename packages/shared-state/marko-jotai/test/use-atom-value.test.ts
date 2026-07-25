import { render, screen, waitFor } from "@marko/testing-library";
import { atom, createStore, getDefaultStore } from "marko-jotai";
import { describe, expect, test } from "vitest";

import { deferred } from "./deferred";
import AsyncAtom from "./fixtures/async-atom.marko";
import UseAtomValue from "./fixtures/use-atom-value.marko";

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
