import { fireEvent, render, screen, waitFor } from "@marko/testing-library";
import {
  ApolloClient,
  ApolloLink,
  gql,
  InMemoryCache,
  Observable,
} from "@marko-bindings/apollo-client";
import type { Observer } from "rxjs";
import { describe, expect, test, vi } from "vitest";

import ConstMutation, {
  type GreetingMutation,
} from "./fixtures/const-mutation.marko";
import ConstMutationWithoutResult from "./fixtures/const-mutation-without-result.marko";

const GREETING_MUTATION = gql`
  mutation SetGreeting($greeting: String!, $language: String) {
    setGreeting(greeting: $greeting)
  }
`;

describe("const-mutation tag", () => {
  test("executes a mutation and publishes its state", async () => {
    const observers: Array<Observer<{ data: GreetingMutation }>> = [];
    const variables: Array<Record<string, unknown>> = [];
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        (operation) =>
          new Observable((observer) => {
            variables.push(operation.variables);
            observers.push(observer);
          }),
      ),
    });

    await render(ConstMutation, {
      client: () => client,
      mutation: () => GREETING_MUTATION,
      variables: { greeting: "Default greeting", language: "en" },
    });

    expect(screen.getByText("Idle")).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    expect(screen.getByText("Loading...")).toBeTruthy();
    await waitFor(() => expect(observers).toHaveLength(1));
    expect(variables).toEqual([{ greeting: "Hello, Marko", language: "en" }]);
    observers[0].next({ data: { setGreeting: "Hello, Marko" } });
    observers[0].complete();

    await waitFor(() => expect(screen.getByText("Hello, Marko")).toBeTruthy());
  });

  test("returns mutate without requiring content", async () => {
    const observers: Array<Observer<{ data: GreetingMutation }>> = [];
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            observers.push(observer);
          }),
      ),
    });

    await render(ConstMutationWithoutResult, {
      client: () => client,
      mutation: () => GREETING_MUTATION,
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Mutate without result" }),
    );

    await waitFor(() => expect(observers).toHaveLength(1));
    observers[0].next({ data: { setGreeting: "Hello without result" } });
    observers[0].complete();
  });

  test("keeps the result from the latest overlapping execution", async () => {
    const observers: Array<Observer<{ data: GreetingMutation }>> = [];
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            observers.push(observer);
          }),
      ),
    });

    await render(ConstMutation, {
      client: () => client,
      mutation: () => GREETING_MUTATION,
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));
    await waitFor(() => expect(observers).toHaveLength(2));

    observers[1].next({ data: { setGreeting: "Latest greeting" } });
    observers[1].complete();
    await waitFor(() =>
      expect(screen.getByText("Latest greeting")).toBeTruthy(),
    );

    observers[0].next({ data: { setGreeting: "Stale greeting" } });
    observers[0].complete();

    await waitFor(() =>
      expect(screen.queryByText("Stale greeting")).toBeNull(),
    );
    expect(screen.getByText("Latest greeting")).toBeTruthy();
  });

  test("publishes an error from a failed mutation", async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            observer.error(new Error("Mutation failed"));
          }),
      ),
    });

    await render(ConstMutation, {
      client: () => client,
      mutation: () => GREETING_MUTATION,
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    expect(await screen.findByText("Error: Mutation failed")).toBeTruthy();
  });

  test("resets the published mutation state", async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            observer.next({ data: { setGreeting: "Hello, Marko" } });
            observer.complete();
          }),
      ),
    });

    await render(ConstMutation, {
      client: () => client,
      mutation: () => GREETING_MUTATION,
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));
    await waitFor(() => expect(screen.getByText("Hello, Marko")).toBeTruthy());

    await fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByText("Idle")).toBeTruthy();
  });

  test("logs and rejects when the client getter returns undefined", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await render(ConstMutation, {
      client: () => undefined,
      mutation: () => GREETING_MUTATION,
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    expect(consoleError).toHaveBeenCalledWith(
      "<const-mutation> requires a client input.",
    );
    expect(
      await screen.findByText(
        "Error: <const-mutation> requires a client input.",
      ),
    ).toBeTruthy();
    consoleError.mockRestore();
  });

  test("logs and rejects when the mutation getter is missing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.empty(),
    });

    await render(ConstMutation, {
      client: () => client,
      // @ts-expect-error Exercise the runtime diagnostic for invalid callers.
      mutation: GREETING_MUTATION,
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    expect(consoleError).toHaveBeenCalledWith(
      "<const-mutation> requires a mutation input.",
    );
    expect(
      await screen.findByText(
        "Error: <const-mutation> requires a mutation input.",
      ),
    ).toBeTruthy();
    consoleError.mockRestore();
  });
});
