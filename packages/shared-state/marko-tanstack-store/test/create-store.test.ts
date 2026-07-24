import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@marko/testing-library";
import { afterEach, describe, expect, test } from "vitest";

import CreateStore from "./fixtures/create-store.marko";

afterEach(cleanup);

describe("create-store tag", () => {
  test("creates a writable store", async () => {
    await render(CreateStore, { initialCount: 2 });

    expect(screen.getByText("2")).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Increment" }));

    await waitFor(() => expect(screen.getByText("3")).toBeTruthy());
  });
});
