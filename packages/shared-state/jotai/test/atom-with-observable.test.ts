import { render, screen, waitFor } from "@marko/testing-library";
import { createStore } from "@marko-bindings/jotai";
import { atomWithObservable } from "@marko-bindings/jotai/utils";
import { Subject } from "rxjs";
import { describe, expect, test } from "vitest";

import ObservableAtom from "./fixtures/observable-atom.marko";

describe("atomWithObservable utility", () => {
  test("suspends until an observable emits its first value", async () => {
    const subject = new Subject<number>();
    const observableAtom = atomWithObservable(() => subject.asObservable());
    const store = createStore();

    await render(ObservableAtom, { atom: observableAtom, store });

    expect(await screen.findByText("Waiting for first value...")).toBeTruthy();

    subject.next(42);

    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());

    subject.next(43);

    await waitFor(() => expect(screen.getByText("43")).toBeTruthy());
  });

  test("does not suspend when an initial value is provided", async () => {
    const subject = new Subject<number>();
    const observableAtom = atomWithObservable(() => subject.asObservable(), {
      initialValue: 41,
    });
    const store = createStore();

    await render(ObservableAtom, { atom: observableAtom, store });

    expect(screen.getByText("41")).toBeTruthy();
    expect(screen.queryByText("Waiting for first value...")).toBeNull();

    subject.next(42);

    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
  });

  test("forwards observable errors to the try catch block", async () => {
    const subject = new Subject<number>();
    const observableAtom = atomWithObservable(() => subject.asObservable());

    await render(ObservableAtom, {
      atom: observableAtom,
      store: createStore(),
    });
    await screen.findByText("Waiting for first value...");

    subject.error(new Error("No number"));

    expect(await screen.findByText("Error: No number")).toBeTruthy();
  });
});
