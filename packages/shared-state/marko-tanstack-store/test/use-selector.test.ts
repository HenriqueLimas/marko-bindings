import { cleanup, render, screen, waitFor } from "@marko/testing-library";
import { createStore } from "marko-tanstack-store";
import { afterEach, describe, expect, test, vi } from "vitest";

import ConditionalUseSelector from "./fixtures/conditional-use-selector.marko";
import UseSelector from "./fixtures/use-selector.marko";

afterEach(cleanup);

const selectCount = (state: { count: number }) => state.count;

describe("use-selector tag", () => {
  test("returns the selected store value", async () => {
    const store = createStore({ count: 1, label: "one" });

    await render(UseSelector, { store, selector: selectCount });

    expect(screen.getByText("1")).toBeTruthy();
  });

  test("reacts to selected store updates", async () => {
    const store = createStore({ count: 1, label: "one" });

    await render(UseSelector, { store, selector: selectCount });
    store.setState((state) => ({ ...state, count: state.count + 1 }));

    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });

  test("uses a custom comparison before publishing a selection", async () => {
    const store = createStore({ count: 1, label: "one" });
    const compare = vi.fn(() => true);

    await render(UseSelector, {
      store,
      selector: selectCount,
      compare,
    });
    store.setState((state) => ({ ...state, count: 2 }));

    await waitFor(() => expect(compare).toHaveBeenCalledWith(1, 2));
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.queryByText("2")).toBeNull();
  });

  test("updates when the selector changes", async () => {
    const store = createStore({ count: 1, label: "one" });
    const result = await render(UseSelector, {
      store,
      selector: selectCount,
    });

    await result.rerender({
      store,
      selector: (state) => state.label.length,
      compare: undefined,
    });

    await waitFor(() => expect(screen.getByText("3")).toBeTruthy());
  });

  test("moves the subscription when the store changes", async () => {
    const firstStore = createStore({ count: 1, label: "one" });
    const secondStore = createStore({ count: 10, label: "ten" });
    const result = await render(UseSelector, {
      store: firstStore,
      selector: selectCount,
    });

    await result.rerender({
      store: secondStore,
      selector: selectCount,
      compare: undefined,
    });
    await waitFor(() => expect(screen.getByText("10")).toBeTruthy());

    firstStore.setState((state) => ({ ...state, count: 2 }));
    secondStore.setState((state) => ({ ...state, count: 11 }));

    await waitFor(() => expect(screen.getByText("11")).toBeTruthy());
    expect(screen.queryByText("2")).toBeNull();
  });

  test("unsubscribes when the tag is removed", async () => {
    const unsubscribe = vi.fn();
    const store = {
      get: () => ({ count: 1, label: "one" }),
      subscribe: vi.fn(() => ({ unsubscribe })),
    };

    const result = await render(ConditionalUseSelector, {
      store,
      show: true,
    });
    await result.rerender({ store, show: false });

    expect(store.subscribe).toHaveBeenCalledOnce();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
