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

import AwaitQuery from "./fixtures/await-query.marko";
import ConditionalAwaitQuery from "./fixtures/conditional-await-query.marko";
import InitializedAwaitQuery from "./fixtures/initialized-await-query.marko";

const GREETING_QUERY = gql`
  query Greeting {
    greeting
  }
`;

describe("await-query tag", () => {
  test("logs and publishes an error when the client getter is missing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    // @ts-expect-error Exercise the runtime diagnostic for invalid callers.
    await render(AwaitQuery, {
      query: () => GREETING_QUERY,
    });

    expect(consoleError).toHaveBeenCalledWith(
      "<await-query> requires a client input.",
    );
    expect(
      await screen.findByText("Error: <await-query> requires a client input."),
    ).toBeTruthy();
    consoleError.mockRestore();
  });

  test("logs and publishes an error when the browser getter returns undefined", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await render(AwaitQuery, {
      client: () => undefined,
      query: () => GREETING_QUERY,
    });

    expect(consoleError).toHaveBeenCalledWith(
      "<await-query> requires a client input.",
    );
    expect(
      await screen.findByText("Error: <await-query> requires a client input."),
    ).toBeTruthy();
    consoleError.mockRestore();
  });

  test("logs and publishes an error when the query getter is missing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.empty(),
    });

    // @ts-expect-error Exercise the runtime diagnostic for invalid callers.
    await render(AwaitQuery, { client: () => client, query: GREETING_QUERY });

    expect(consoleError).toHaveBeenCalledWith(
      "<await-query> requires a query input.",
    );
    expect(
      await screen.findByText("Error: <await-query> requires a query input."),
    ).toBeTruthy();
    consoleError.mockRestore();
  });

  test("uses the initialized client when no client input is passed", async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.empty(),
    });
    client.writeQuery({
      query: GREETING_QUERY,
      data: { greeting: "Initialized greeting" },
    });

    await render(InitializedAwaitQuery, {
      client: () => client,
      query: () => GREETING_QUERY,
    });

    expect(await screen.findByText("Initialized greeting")).toBeTruthy();
  });

  test("uses the browser client during client-only rendering", async () => {
    const observers: Array<Observer<{ data: { greeting: string } }>> = [];
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(
        () =>
          new Observable((observer) => {
            observers.push(observer);
          }),
      ),
    });

    await render(AwaitQuery, {
      client: () => client,
      query: () => GREETING_QUERY,
    });

    expect(await screen.findByText("Loading...")).toBeTruthy();
    await waitFor(() => expect(observers).toHaveLength(1));

    observers[0].next({ data: { greeting: "Hello, Marko" } });
    observers[0].complete();

    await waitFor(() => expect(screen.getByText("Hello, Marko")).toBeTruthy());
    expect(screen.queryByText("Loading...")).toBeNull();
  });

  test("stops the observable query when the tag is removed", async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.empty(),
    });
    client.writeQuery({
      query: GREETING_QUERY,
      data: { greeting: "Cached greeting" },
    });
    const observable = client.watchQuery({ query: GREETING_QUERY });
    const stop = vi.spyOn(observable, "stop");
    const watchQuery = vi
      .spyOn(client, "watchQuery")
      .mockReturnValue(observable);
    const getClient = () => client;
    const getQuery = () => GREETING_QUERY;

    const result = await render(ConditionalAwaitQuery, {
      client: getClient,
      query: getQuery,
      show: true,
    });
    await waitFor(() => expect(watchQuery).toHaveBeenCalledOnce());
    expect(watchQuery).toHaveBeenCalledWith({ query: GREETING_QUERY });
    await result.rerender({
      client: getClient,
      query: getQuery,
      show: false,
    });

    expect(stop).toHaveBeenCalledOnce();
  });
});
