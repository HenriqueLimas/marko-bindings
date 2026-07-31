import { render, screen, waitFor } from "@marko/testing-library";
import { QueryClient } from "@marko-bindings/tanstack-query";
import { describe, expect, test, vi } from "vitest";

import ConditionalConstQuery from "./fixtures/conditional-const-query.marko";
import ConstQuery from "./fixtures/const-query.marko";
import InitializedConstQuery from "./fixtures/initialized-const-query.marko";

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

describe("const-query tag", () => {
  test("publishes pending, fetching, and success events", async () => {
    const client = createClient();
    let resolveQuery!: (value: Greeting) => void;
    const queryFn = vi.fn(
      () =>
        new Promise<Greeting>((resolve) => {
          resolveQuery = resolve;
        }),
    );

    await render(ConstQuery, {
      client: () => client,
      query: greetingQuery(queryFn),
    });

    expect(await screen.findByText("pending:fetching")).toBeTruthy();
    expect(screen.getByText("No greeting")).toBeTruthy();
    expect(queryFn).toHaveBeenCalledOnce();

    resolveQuery({ greeting: "Hello, Marko" });

    expect(await screen.findByText("Hello, Marko")).toBeTruthy();
    expect(screen.getByText("success:idle")).toBeTruthy();
  });

  test("does not start a disabled query", async () => {
    const queryFn = vi.fn(async () => ({ greeting: "Unused" }));

    await render(ConstQuery, {
      client: () => createClient(),
      query: () => ({
        queryKey: ["greeting"] as const,
        queryFn,
        enabled: false,
      }),
    });

    expect(screen.getByText("pending:idle")).toBeTruthy();
    expect(queryFn).not.toHaveBeenCalled();
  });

  test("uses the initialized client", async () => {
    const client = createClient();
    client.setQueryData(["greeting"], { greeting: "Initialized greeting" });

    await render(InitializedConstQuery, {
      client: () => client,
      query: () => ({
        queryKey: ["greeting"] as const,
        queryFn: async () => ({ greeting: "Fetched greeting" }),
        staleTime: Infinity,
      }),
    });

    expect(await screen.findByText("Initialized greeting")).toBeTruthy();
  });

  test("publishes background fetching events while retaining data", async () => {
    const client = createClient();
    let resolveRefetch!: (value: Greeting) => void;
    const queryFn = vi.fn(
      () =>
        new Promise<Greeting>((resolve) => {
          resolveRefetch = resolve;
        }),
    );
    client.setQueryData(["greeting"], { greeting: "Cached greeting" });

    await render(ConstQuery, {
      client: () => client,
      query: greetingQuery(queryFn),
    });

    expect(await screen.findByText("Cached greeting")).toBeTruthy();
    expect(screen.getByText("success:fetching")).toBeTruthy();

    resolveRefetch({ greeting: "Refetched greeting" });

    expect(await screen.findByText("Refetched greeting")).toBeTruthy();
    expect(screen.getByText("success:idle")).toBeTruthy();
  });

  test("reacts to cache updates", async () => {
    const client = createClient();
    const getClient = () => client;

    await render(ConstQuery, {
      client: getClient,
      query: () => ({
        queryKey: ["greeting"] as const,
        queryFn: async () => ({ greeting: "Initial greeting" }),
        staleTime: Infinity,
      }),
    });
    expect(await screen.findByText("Initial greeting")).toBeTruthy();

    client.setQueryData(["greeting"], { greeting: "Cached greeting" });

    expect(await screen.findByText("Cached greeting")).toBeTruthy();
  });

  test("publishes query errors", async () => {
    await render(ConstQuery, {
      client: () => createClient(),
      query: greetingQuery(async () => {
        throw new Error("Query failed");
      }),
    });

    expect(await screen.findByText("Error: Query failed")).toBeTruthy();
    expect(screen.getByText("error:idle")).toBeTruthy();
  });

  test("throws when the client is missing", async () => {
    await expect(
      render(ConstQuery, {
        client: () => undefined,
        query: greetingQuery(async () => ({ greeting: "Unused" })),
      }),
    ).rejects.toThrow("<const-query> requires a client input.");
  });

  test("throws query setup errors", async () => {
    await expect(
      render(ConstQuery, {
        client: () => createClient(),
        query: () => {
          throw new Error("Query setup failed");
        },
      }),
    ).rejects.toThrow("Query setup failed");
  });

  test("unsubscribes when the tag is removed", async () => {
    const client = createClient();
    const getClient = () => client;
    const query = () => ({
      queryKey: ["greeting"],
      queryFn: async () => ({ greeting: "Unused" }),
      initialData: { greeting: "Cached greeting" },
      staleTime: Infinity,
    });

    const rendered = await render(ConditionalConstQuery, {
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

    await waitFor(() => expect(cachedQuery?.getObserversCount()).toBe(0));
  });
});
