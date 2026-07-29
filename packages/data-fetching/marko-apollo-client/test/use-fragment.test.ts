import { render, screen, waitFor } from "@marko/testing-library";
import {
  ApolloClient,
  ApolloLink,
  gql,
  InMemoryCache,
} from "marko-apollo-client";
import { describe, expect, test, vi } from "vitest";

import ConditionalUseFragment from "./fixtures/conditional-use-fragment.marko";
import UseFragment, { type DogFragment } from "./fixtures/use-fragment.marko";
import UseFragments from "./fixtures/use-fragments.marko";
import UseNullFragment from "./fixtures/use-null-fragment.marko";

const DOG_FRAGMENT = gql`
  fragment DogFields on Dog {
    id
    name
  }
`;

function createClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.empty(),
  });
}

function writeDog(client: ApolloClient, id: string, name: string) {
  client.writeFragment<DogFragment>({
    fragment: DOG_FRAGMENT,
    data: { __typename: "Dog", id, name },
  });
}

describe("use-fragment tag", () => {
  test("renders the current fragment and reacts to cache writes", async () => {
    const client = createClient();
    writeDog(client, "1", "Buck");

    await render(UseFragment, {
      client: () => client,
      fragment: () => DOG_FRAGMENT,
      from: "Dog:1",
    });

    expect(await screen.findByText("Buck")).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();

    writeDog(client, "1", "Luna");

    await waitFor(() => expect(screen.getByText("Luna")).toBeTruthy());
  });

  test("renders partial cache data without starting a network request", async () => {
    const client = createClient();
    client.cache.restore({
      "Dog:1": { __typename: "Dog", id: "1" },
    });

    await render(UseFragment, {
      client: () => client,
      fragment: () => DOG_FRAGMENT,
      from: "Dog:1",
    });

    expect(await screen.findByText("Unknown dog")).toBeTruthy();
    expect(screen.getByText("Partial")).toBeTruthy();
  });

  test("identifies entity objects before watching the fragment", async () => {
    const client = createClient();
    writeDog(client, "1", "Buck");
    const watchFragment = vi.spyOn(client, "watchFragment");

    await render(UseFragment, {
      client: () => client,
      fragment: () => DOG_FRAGMENT,
      from: { __typename: "Dog", id: "1" },
    });

    expect(await screen.findByText("Buck")).toBeTruthy();
    expect(watchFragment).toHaveBeenCalledWith({
      fragment: DOG_FRAGMENT,
      from: "Dog:1",
    });
  });

  test("supports arrays and preserves null entries", async () => {
    const client = createClient();
    writeDog(client, "1", "Buck");
    writeDog(client, "2", "Luna");

    await render(UseFragments, {
      client: () => client,
      fragment: () => DOG_FRAGMENT,
      from: ["Dog:1", null, "Dog:2"],
    });

    expect(await screen.findByText("Buck, Missing, Luna")).toBeTruthy();
  });

  test("publishes a stable partial result when from is null", async () => {
    const client = createClient();
    const watchFragment = vi.spyOn(client, "watchFragment");

    await render(UseNullFragment, {
      client: () => client,
      fragment: () => DOG_FRAGMENT,
    });

    expect(await screen.findByText("{} Partial")).toBeTruthy();
    expect(watchFragment).not.toHaveBeenCalled();
  });

  test("replaces the cache watch when from changes", async () => {
    const client = createClient();
    writeDog(client, "1", "Buck");
    writeDog(client, "2", "Luna");
    const getClient = () => client;
    const getFragment = () => DOG_FRAGMENT;
    const result = await render(UseFragment, {
      client: getClient,
      fragment: getFragment,
      from: "Dog:1",
    });
    expect(await screen.findByText("Buck")).toBeTruthy();

    await result.rerender({
      client: getClient,
      fragment: getFragment,
      from: "Dog:2",
    });

    expect(await screen.findByText("Luna")).toBeTruthy();
  });

  test("unsubscribes when the tag is removed", async () => {
    const client = createClient();
    writeDog(client, "1", "Buck");
    const observable = client.watchFragment({
      fragment: DOG_FRAGMENT,
      from: "Dog:1",
    });
    const subscribe = vi.spyOn(observable, "subscribe");
    vi.spyOn(client, "watchFragment").mockReturnValue(observable);
    const getClient = () => client;
    const getFragment = () => DOG_FRAGMENT;

    const result = await render(ConditionalUseFragment, {
      client: getClient,
      fragment: getFragment,
      from: "Dog:1",
      show: true,
    });
    await waitFor(() => expect(screen.getByText("Buck")).toBeTruthy());
    const unsubscribe = vi.spyOn(
      subscribe.mock.results[0].value,
      "unsubscribe",
    );
    await result.rerender({
      client: getClient,
      fragment: getFragment,
      from: "Dog:1",
      show: false,
    });

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  test("logs a diagnostic when the fragment getter is missing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const client = createClient();

    await render(UseFragment, {
      client: () => client,
      // @ts-expect-error Exercise the runtime diagnostic for invalid callers.
      fragment: DOG_FRAGMENT,
      from: "Dog:1",
    });

    expect(consoleError).toHaveBeenCalledWith(
      "<use-fragment> requires a fragment input.",
    );
    expect(await screen.findByText("Partial")).toBeTruthy();
    consoleError.mockRestore();
  });

  test("logs a diagnostic when from is missing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const client = createClient();

    await render(UseFragment, {
      client: () => client,
      fragment: () => DOG_FRAGMENT,
      // @ts-expect-error Exercise the runtime diagnostic for invalid callers.
      from: undefined,
    });

    expect(consoleError).toHaveBeenCalledWith(
      "<use-fragment> requires a from input.",
    );
    expect(await screen.findByText("Partial")).toBeTruthy();
    consoleError.mockRestore();
  });

  test("logs a diagnostic when the browser client is unavailable", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await render(UseFragment, {
      client: () => undefined,
      fragment: () => DOG_FRAGMENT,
      from: "Dog:1",
    });

    expect(consoleError).toHaveBeenCalledWith(
      "<use-fragment> requires a client input.",
    );
    expect(await screen.findByText("Unknown dog")).toBeTruthy();
    expect(screen.getByText("Partial")).toBeTruthy();
    consoleError.mockRestore();
  });
});
