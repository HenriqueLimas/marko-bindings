import { render, screen, waitFor } from "@marko/testing-library";
import {
  ApolloClient,
  ApolloLink,
  gql,
  InMemoryCache,
  Observable,
} from "marko-apollo-client";
import type { Observer } from "rxjs";
import { describe, expect, test, vi } from "vitest";

import ConditionalUseSubscription from "./fixtures/conditional-use-subscription.marko";
import UseSubscription, {
  type TickSubscription,
} from "./fixtures/use-subscription.marko";

const TICK_SUBSCRIPTION = gql`
  subscription Tick {
    tick
  }
`;

describe("use-subscription tag", () => {
  test("renders loading state until the first event and publishes later events", async () => {
    const observers: Array<Observer<{ data: TickSubscription }>> = [];
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            observers.push(observer);
          }),
      ),
    });

    await render(UseSubscription, {
      client: () => client,
      subscription: () => TICK_SUBSCRIPTION,
    });

    expect(await screen.findByText("Loading...")).toBeTruthy();
    await waitFor(() => expect(observers).toHaveLength(1));

    observers[0].next({ data: { tick: 1 } });
    await waitFor(() => expect(screen.getByText("1")).toBeTruthy());
    expect(screen.queryByText("Loading...")).toBeNull();

    observers[0].next({ data: { tick: 2 } });
    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });

  test("publishes a stream error after the first event", async () => {
    const observers: Array<Observer<{ data: TickSubscription }>> = [];
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            observers.push(observer);
          }),
      ),
    });

    await render(UseSubscription, {
      client: () => client,
      subscription: () => TICK_SUBSCRIPTION,
    });
    await waitFor(() => expect(observers).toHaveLength(1));
    observers[0].next({ data: { tick: 1 } });
    await waitFor(() => expect(screen.getByText("1")).toBeTruthy());

    observers[0].error(new Error("Subscription failed"));

    expect(await screen.findByText("Error: Subscription failed")).toBeTruthy();
  });

  test("publishes an initial stream error", async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            observer.error(new Error("Subscription failed"));
          }),
      ),
    });

    await render(UseSubscription, {
      client: () => client,
      subscription: () => TICK_SUBSCRIPTION,
    });

    expect(await screen.findByText("Error: Subscription failed")).toBeTruthy();
  });

  test("logs and publishes an error when the client getter returns undefined", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await render(UseSubscription, {
      client: () => undefined,
      subscription: () => TICK_SUBSCRIPTION,
    });

    expect(consoleError).toHaveBeenCalledWith(
      "<use-subscription> requires a client input.",
    );
    expect(
      await screen.findByText(
        "Error: <use-subscription> requires a client input.",
      ),
    ).toBeTruthy();
    consoleError.mockRestore();
  });

  test("logs and publishes an error when the subscription getter is missing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.empty(),
    });

    await render(UseSubscription, {
      client: () => client,
      // @ts-expect-error Exercise the runtime diagnostic for invalid callers.
      subscription: TICK_SUBSCRIPTION,
    });

    expect(consoleError).toHaveBeenCalledWith(
      "<use-subscription> requires a subscription input.",
    );
    expect(
      await screen.findByText(
        "Error: <use-subscription> requires a subscription input.",
      ),
    ).toBeTruthy();
    consoleError.mockRestore();
  });

  test("unsubscribes when the tag is removed", async () => {
    const unsubscribe = vi.fn();
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable(() => {
            return unsubscribe;
          }),
      ),
    });
    const getClient = () => client;
    const getSubscription = () => TICK_SUBSCRIPTION;
    const result = await render(ConditionalUseSubscription, {
      client: getClient,
      subscription: getSubscription,
      show: true,
    });
    await waitFor(() => expect(screen.getByText("Loading...")).toBeTruthy());
    await result.rerender({
      client: getClient,
      subscription: getSubscription,
      show: false,
    });

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
