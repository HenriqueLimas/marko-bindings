import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@marko/testing-library";
import { createAtom } from "marko-tanstack-store";
import { afterEach, describe, expect, test } from "vitest";

import LetAtom from "./fixtures/let-atom.marko";

afterEach(cleanup);

describe("atom tags", () => {
  test("let-atom reacts to an external atom", async () => {
    const atom = createAtom(1);

    await render(LetAtom, { atom });
    atom.set(2);

    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });

  test("uses custom comparison without disabling writes", async () => {
    const atom = createAtom(1);

    await render(LetAtom, { atom, compare: () => true });
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(atom.get()).toBe(6));
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.queryByText("6")).toBeNull();
  });

  test("writes assignments back to the atom", async () => {
    const atom = createAtom(1);

    await render(LetAtom, { atom });
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(screen.getByText("6")).toBeTruthy());
    expect(atom.get()).toBe(6);
  });
});
