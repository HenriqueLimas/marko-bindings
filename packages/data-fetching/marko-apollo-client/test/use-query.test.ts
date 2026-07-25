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

import ConditionalUseQuery from "./fixtures/conditional-use-query.marko";
import UseQuery from "./fixtures/use-query.marko";

const GREETING_QUERY = gql`
  query Greeting {
    greeting
  }
`;

describe("use-query tag", () => {
  test("publishes loading and query results from the provided client", async () => {
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

    await render(UseQuery, { client, query: GREETING_QUERY });

    await waitFor(() =>
      expect(screen.getByText("No greeting").hasAttribute("data-loading")).toBe(
        true,
      ),
    );
    await waitFor(() => expect(observers).toHaveLength(1));

    observers[0].next({ data: { greeting: "Hello, Marko" } });
    observers[0].complete();

    await waitFor(() => expect(screen.getByText("Hello, Marko")).toBeTruthy());
    expect(screen.getByText("Hello, Marko").hasAttribute("data-loading")).toBe(
      false,
    );
  });

  test("stops the observable query when the tag is removed", async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: ApolloLink.empty(),
    });
    const observable = client.watchQuery({ query: GREETING_QUERY });
    const stop = vi.spyOn(observable, "stop");
    const watchQuery = vi
      .spyOn(client, "watchQuery")
      .mockReturnValue(observable);

    const result = await render(ConditionalUseQuery, {
      client,
      query: GREETING_QUERY,
      show: true,
    });
    await waitFor(() => expect(watchQuery).toHaveBeenCalledOnce());
    expect(watchQuery).toHaveBeenCalledWith({ query: GREETING_QUERY });
    await result.rerender({
      client,
      query: GREETING_QUERY,
      show: false,
    });

    expect(stop).toHaveBeenCalledOnce();
  });
});
