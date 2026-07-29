import { render, screen, waitFor } from "@marko/testing-library";
import { QueryClient } from "@marko-bindings/tanstack-query";
import { describe, expect, test, vi } from "vitest";

import AwaitQuery from "./fixtures/await-query.marko";
import AwaitSelectedQuery from "./fixtures/await-selected-query.marko";
import ConditionalAwaitQuery from "./fixtures/conditional-await-query.marko";
import InitializedAwaitQuery from "./fixtures/initialized-await-query.marko";

interface Greeting {
  greeting: string;
}

const createClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const greetingQuery = (queryFn: () => Promise<Greeting>) => () => ({
  queryKey: ["greeting"] as const,
  queryFn,
});

describe("await-query tag", () => {
  test("logs and publishes an error when the client getter is missing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    // @ts-expect-error Exercise the runtime diagnostic for invalid callers.
    await render(AwaitQuery, {
      query: greetingQuery(async () => ({ greeting: "Hello" })),
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
      query: greetingQuery(async () => ({ greeting: "Hello" })),
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
    const client = createClient();

    // @ts-expect-error Exercise the runtime diagnostic for invalid callers.
    await render(AwaitQuery, { client: () => client, query: {} });

    expect(consoleError).toHaveBeenCalledWith(
      "<await-query> requires a query input.",
    );
    expect(
      await screen.findByText("Error: <await-query> requires a query input."),
    ).toBeTruthy();
    consoleError.mockRestore();
  });

  test("uses the initialized client when no client input is passed", async () => {
    const client = createClient();
    client.setQueryData(["greeting"], { greeting: "Initialized greeting" });

    await render(InitializedAwaitQuery, {
      client: () => client,
      query: () => ({
        queryKey: ["greeting"] as const,
        queryFn: async () => ({ greeting: "Fetched greeting" }),
        staleTime: Infinity,
      }),
    });

    expect(await screen.findByText("Initialized greeting")).toBeTruthy();
  });

  test("uses the browser client during client-only rendering", async () => {
    const client = createClient();
    let resolveQuery!: (value: Greeting) => void;
    const queryFn = vi.fn(
      () =>
        new Promise<Greeting>((resolve) => {
          resolveQuery = resolve;
        }),
    );

    await render(AwaitQuery, {
      client: () => client,
      query: greetingQuery(queryFn),
    });

    expect(await screen.findByText("Loading...")).toBeTruthy();
    await waitFor(() => expect(queryFn).toHaveBeenCalledOnce());

    resolveQuery({ greeting: "Hello, Marko" });

    expect(await screen.findByText("Hello, Marko")).toBeTruthy();
    expect(screen.queryByText("Loading...")).toBeNull();
  });

  test("reacts to cache updates", async () => {
    const client = createClient();
    const getClient = () => client;
    const query = greetingQuery(async () => ({
      greeting: "Initial greeting",
    }));

    await render(AwaitQuery, { client: getClient, query });
    expect(await screen.findByText("Initial greeting")).toBeTruthy();

    client.setQueryData(["greeting"], { greeting: "Cached greeting" });

    expect(await screen.findByText("Cached greeting")).toBeTruthy();
  });

  test("keeps selected observer data separate from raw cache data", async () => {
    const client = createClient();

    await render(AwaitSelectedQuery, {
      client: () => client,
      query: () => ({
        queryKey: ["selected-greeting"] as const,
        queryFn: async () => ({ greeting: "Hello, Marko" }),
        select: (data) => data.greeting,
      }),
    });

    expect(await screen.findByText("Hello, Marko")).toBeTruthy();
    expect(client.getQueryData(["selected-greeting"])).toEqual({
      greeting: "Hello, Marko",
    });
  });

  test("keeps settled content visible during a background refetch", async () => {
    const client = createClient();
    let callCount = 0;
    let resolveRefetch!: (value: Greeting) => void;
    const queryFn = vi.fn(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve({ greeting: "Initial greeting" });
      }
      return new Promise<Greeting>((resolve) => {
        resolveRefetch = resolve;
      });
    });

    await render(AwaitQuery, {
      client: () => client,
      query: greetingQuery(queryFn),
    });
    expect(await screen.findByText("Initial greeting")).toBeTruthy();

    void client.invalidateQueries({ queryKey: ["greeting"] });
    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Initial greeting")).toBeTruthy();
    expect(screen.queryByText("Loading...")).toBeNull();

    resolveRefetch({ greeting: "Refetched greeting" });
    expect(await screen.findByText("Refetched greeting")).toBeTruthy();
  });

  test("publishes query errors as settled results", async () => {
    const client = createClient();

    await render(AwaitQuery, {
      client: () => client,
      query: greetingQuery(async () => {
        throw new Error("Query failed");
      }),
    });

    expect(await screen.findByText("Error: Query failed")).toBeTruthy();
    expect(screen.queryByText("Loading...")).toBeNull();
  });

  test("unsubscribes from the query when the tag is removed", async () => {
    const client = createClient();
    const getClient = () => client;
    const query = () => ({
      queryKey: ["greeting"],
      queryFn: async () => ({ greeting: "Unused" }),
      initialData: { greeting: "Cached greeting" },
      staleTime: Infinity,
    });

    const rendered = await render(ConditionalAwaitQuery, {
      client: getClient,
      query,
      show: true,
    });
    expect(await screen.findByText("Cached greeting")).toBeTruthy();
    const cachedQuery = client.getQueryCache().find({
      queryKey: ["greeting"],
    });
    expect(cachedQuery?.getObserversCount()).toBe(1);

    await rendered.rerender({ client: getClient, query, show: false });

    expect(cachedQuery?.getObserversCount()).toBe(0);
  });
});
