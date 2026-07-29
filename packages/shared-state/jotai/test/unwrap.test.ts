import { render, screen, waitFor } from "@marko/testing-library";
import { atom, createStore } from "@marko-bindings/jotai";
import { describe, expect, test } from "vitest";

import { deferred } from "./deferred";
import UnwrappedAtom from "./fixtures/unwrapped-atom.marko";

describe("unwrap utility", () => {
  test("exposes pending promises as synchronous values", async () => {
    const firstValue = deferred<number>();
    const sourceAtom = atom(firstValue.promise);
    const asyncAtom = atom((get) => get(sourceAtom));
    const store = createStore();

    await render(UnwrappedAtom, { atom: asyncAtom, store });

    expect(screen.getByText("Loading...")).toBeTruthy();

    firstValue.resolve(42);

    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());

    const nextValue = deferred<number>();
    store.set(sourceAtom, nextValue.promise);

    await waitFor(() => expect(screen.getByText("Loading...")).toBeTruthy());

    nextValue.resolve(43);

    await waitFor(() => expect(screen.getByText("43")).toBeTruthy());
  });
});
