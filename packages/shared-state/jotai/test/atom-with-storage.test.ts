import { fireEvent, render, screen, waitFor } from "@marko/testing-library";
import { describe, expect, test } from "vitest";

import AtomWithStorage from "./fixtures/atom-with-storage.marko";

describe("atomWithStorage utility", () => {
  test("persists writable atom updates", async () => {
    await render(AtomWithStorage);
    await fireEvent.click(screen.getByRole("button", { name: "Add five" }));

    await waitFor(() => expect(screen.getByText("6")).toBeTruthy());
    expect(localStorage.getItem("@marko-bindings/jotai-count")).toBe("6");
  });
});
