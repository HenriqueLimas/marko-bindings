import { render, screen, waitFor } from "@marko/testing-library";
import { atom, createStore } from "@marko-bindings/jotai";
import { describe, expect, test } from "vitest";

import ConstAtom from "./fixtures/const-atom.marko";

describe("const-atom tag", () => {
  test("returns a reactive read-only atom value", async () => {
    const sourceAtom = atom(1);
    const readableAtom = atom((get) => get(sourceAtom));
    const store = createStore();

    await render(ConstAtom, { atom: readableAtom, store });
    expect(screen.getByText("1")).toBeTruthy();

    store.set(sourceAtom, 2);

    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });
});
