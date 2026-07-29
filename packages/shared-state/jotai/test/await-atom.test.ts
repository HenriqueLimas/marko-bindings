import { render, screen, waitFor } from "@marko/testing-library";
import { atom, createStore, getDefaultStore } from "@marko-bindings/jotai";
import { describe, expect, test } from "vitest";

import { deferred } from "./deferred";
import AsyncAtom from "./fixtures/async-atom.marko";
import AsyncWritableAtom from "./fixtures/async-writable-atom.marko";

describe("await-atom tag", () => {
  test("resolves async readable atoms through a body parameter", async () => {
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

  test("forwards rejected atoms to a surrounding try boundary", async () => {
    const value = deferred<number>();
    const asyncAtom = atom(() => value.promise);
    await render(AsyncAtom, { atom: asyncAtom, store: createStore() });
    await screen.findByText("Loading...");

    value.reject(new Error("No number"));

    expect(await screen.findByText("Error: No number")).toBeTruthy();
  });
});
