import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@marko/testing-library";
import { createAtom } from "marko-tanstack-store";
import { afterEach, describe, expect, test } from "vitest";

import CreateAtom from "./fixtures/create-atom.marko";
import UseAtom from "./fixtures/use-atom.marko";

afterEach(cleanup);

describe("atom tags", () => {
  test("create-atom creates a writable atom", async () => {
    await render(CreateAtom);

    expect(screen.getByText("2")).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(screen.getByText("7")).toBeTruthy());
  });

  test("use-atom reacts to an external atom", async () => {
    const atom = createAtom(1);

    await render(UseAtom, { atom });
    atom.set(2);

    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });

  test("writes assignments back to the atom", async () => {
    const atom = createAtom(1);

    await render(UseAtom, { atom });
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(screen.getByText("6")).toBeTruthy());
    expect(atom.get()).toBe(6);
  });
});
