# marko-apollo-client

Apollo Client bindings for Marko 6.

The package owns `@apollo/client` and its required `graphql` and `rxjs`
dependencies, and re-exports the complete `@apollo/client` entrypoint. An
application only needs to install `marko-apollo-client`; `marko` remains a peer
dependency.

## Install

```sh
pnpm add marko-apollo-client
```

## Usage

Create a browser Apollo Client and a request-scoped server client with
`ssrMode: true`:

```ts
import { ApolloClient, HttpLink, InMemoryCache } from "marko-apollo-client";

let client: ApolloClient | undefined;

export function createClient() {
  return (client ??= new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: "/graphql" }),
  }));
}
```

Put each parsed query behind a getter in a `.marko` module so Marko can resolve
it independently in the server and browser runtimes:

```marko
import { gql, type TypedDocumentNode } from "marko-apollo-client";

export interface GetDogData {
  dog: {
    id: string;
    displayImage: string;
  };
}

export function GET_DOG(): TypedDocumentNode<GetDogData, { name: string }> {
  return gql`
    query GetDog($name: String!) {
      dog(name: $name) {
        id
        displayImage
      }
    }
  `;
}
```

Load the client and query getters from Marko modules. `<use-query>` always
receives a body parameter containing the reactive result:

```marko
import { createClient } from "./apollo-client.marko";
import { GET_DOG } from "./get-dog.marko";

<try>
  <use-query|result|
    client=() => createClient()
    query=() => GET_DOG()
    variables={ name: input.name }
  >
    <if=result.error>${result.error.message}</if>
    <else><img src=result.data?.dog.displayImage></else>
  </use-query>

  <@placeholder>Loading…</@placeholder>
  <@catch|error|>${String(error)}</@catch>
</try>
```

`<use-query>` requires functions for both `client` and `query`, plus a
parameterized body. The client getter may return an Apollo Client or `undefined`.
Returning a client on the server enables SSR; returning `undefined` there
defers the initial request to the browser. The getter must return a client in
the browser. The tag accepts the rest of Apollo's
`ApolloClient.WatchQueryOptions` shape. The getters resolve runtime-local values
without asking Marko to serialize either the client or parsed GraphQL document.
If a required browser getter is missing, the tag logs an error that can be
handled by the surrounding `<try>`.

See the runnable
[Marko Run and Apollo Server example](../../../examples/apollo-client/README.md)
for a complete application with a local `/gql` route.

## API

### `<use-query>`

Render with a reactive query result:

```marko
<use-query|result|
  client=() => createClient()
  query=() => GET_DOG()
  variables={ name: "Buck" }
>
  ${result.data?.dog.displayImage}
</use-query>
```

| Input     | Type                               | Description                               |
| --------- | ---------------------------------- | ----------------------------------------- |
| `client`  | `() => ApolloClient \| undefined`  | Required target-specific client getter.   |
| `query`   | `() => WatchQueryOptions["query"]` | Required target-specific query getter.    |
| `content` | `Marko.Body<[Result]>`             | Required body receiving a settled result. |
| `...`     | `Omit<WatchQueryOptions, "query">` | Remaining Apollo watch-query options.     |

The body parameter is
`Omit<ObservableQuery.Result<MaybeMasked<TData>>, "loading">`. Loading is owned
by Marko's surrounding `<try>`/`<@placeholder>` boundary, so content only
receives settled results. The tag does not return a tag variable.

The tag:

1. calls `client()` on the server and awaits a one-shot query when it returns a
   client;
2. when it returns `undefined` on the server, calls it again after browser
   resumption and starts the initial query there;
3. renders its body inside that async boundary;
4. writes a server result into the browser client's cache;
5. creates an Apollo `watchQuery` for reactive browser updates; and
6. ignores later loading emissions and keeps the last settled result visible;
7. unsubscribes and stops the observable when its inputs change or it leaves the
   document.

Passing the client explicitly keeps ownership visible and avoids render-global
state. Server applications should create a request-scoped client rather than
sharing one cache between users.

## JavaScript exports

The package re-exports the complete `@apollo/client` entrypoint:

```js
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  NetworkStatus,
  ObservableQuery,
  gql,
} from "marko-apollo-client";
```

## Server rendering

Apollo Client and `ObservableQuery` instances, as well as GraphQL
`DocumentNode` objects, cannot cross Marko's server-resume serialization
boundary. `<use-query>` invokes the client and query getters separately in each
runtime. When `client()` returns an Apollo Client on the server, the tag awaits
its query, serializes only the result, then seeds the browser cache before
starting `watchQuery`.

When `client()` returns `undefined` on the server, rendering completes without
opening a pending async stream. A browser script calls the getter again, starts
the query, and places that Promise into the tag's reactive async boundary,
activating the surrounding `<@placeholder>`. The same path is used for
client-only renders and changed query inputs. Background refetches, polling,
and cache updates keep the last settled content visible until Apollo publishes
another settled result.

The server maps `cache-and-network` to `cache-first` for its one-shot query and
leaves `standby` queries pending. Apollo's `ssrMode` still belongs on the server
client: it prevents polling and prioritizes cached values, but it does not start
queries by itself.

Because the server query starts when the tag renders, nested query tags can
create request waterfalls. Prefer starting data known at the route boundary in
the Marko Run handler; use this SSR path when the query is owned by the rendered
tag.
