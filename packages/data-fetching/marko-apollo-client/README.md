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

Export each parsed GraphQL operation or fragment document from a regular
TypeScript module. The inline tag input keeps the document available
independently in the server and browser runtimes:

```ts
import { gql, type TypedDocumentNode } from "marko-apollo-client";

export interface GetDogData {
  dog: {
    id: string;
    displayImage: string;
  };
}

export const GET_DOG: TypedDocumentNode<GetDogData, { name: string }> = gql`
  query GetDog($name: String!) {
    dog(name: $name) {
      id
      displayImage
    }
  }
`;
```

Load the client getter from its target-specific Marko module and the query
constant from its TypeScript module. `<use-query>` always receives the document
through an inline getter and a body parameter containing the reactive result.
GraphQL documents do not need `.marko` modules; reserve those for values such as
client factories that use Marko's `server` and `client` declarations.

```marko
import { createClient } from "./apollo-client.marko";
import { GET_DOG } from "./get-dog.js";

<try>
  <use-query|result|
    client=() => createClient()
    query=() => GET_DOG
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
  query=() => GET_DOG
  variables={ name: "Buck" }
>
  ${result.data?.dog.displayImage}
</use-query>
```

| Input     | Type                               | Description                               |
| --------- | ---------------------------------- | ----------------------------------------- |
| `client`  | `() => ApolloClient \| undefined`  | Required target-specific client getter.   |
| `query`   | `() => WatchQueryOptions["query"]` | Required inline document getter.          |
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

### `<use-fragment>`

Render a reactive view of one normalized entity in the Apollo cache:

```marko
import { createClient } from "./apollo-client.marko";
import { DOG_FIELDS } from "./dog-fields.js";

<use-fragment|result|
  client=() => createClient()
  fragment=() => DOG_FIELDS
  from={ __typename: "Dog", id: input.id }
>
  <if=result.complete>${result.data.name}</if>
  <else>Some dog fields are missing</else>
</use-fragment>
```

| Input          | Type                                     | Description                              |
| -------------- | ---------------------------------------- | ---------------------------------------- |
| `client`       | `() => ApolloClient \| undefined`        | Required target-specific client getter.  |
| `fragment`     | `() => WatchFragmentOptions["fragment"]` | Required inline fragment getter.         |
| `from`         | Entity, cache ID, array, or `null`       | Required normalized cache identifier(s). |
| `content`      | `Marko.Body<[Result]>`                   | Required body receiving the result.      |
| `fragmentName` | `string`                                 | Selects one of multiple fragments.       |
| `variables`    | `OperationVariables`                     | Variables used by the fragment.          |
| `optimistic`   | `boolean`                                | Includes optimistic data; defaults true. |

The body receives Apollo's reactive `WatchFragmentResult`, containing `data`,
`dataState`, `complete`, and a `missing` tree for partial data. The tag is a
lightweight cache binding: it never sends a network request. Use `<use-query>`
or another cache write to populate the entity.

Object identifiers are normalized with `client.cache.identify`, matching
Apollo's React hook and Vue 5 composable. Pass `from` directly rather than
wrapping it in a getter: cache IDs, references, entity key objects, `null`, and
arrays of those values are plain serializable state. Arrays preserve `null`
entries. A top-level `from=null` renders the stable partial result
`{ data: {}, dataState: "partial", complete: false }` without creating a cache
watch.

When a server client is available, the tag renders its current cache snapshot
during SSR. If `client()` returns `undefined` on the server, it renders the same
serializable partial fallback and reads the browser cache after resumption. It
then subscribes with `ApolloClient.watchFragment`, replaces the watch when
inputs change, and unsubscribes when removed. As with the other tags, both the
client and parsed fragment use getters so neither non-serializable value enters
Marko's resume state.

### `<use-mutation>`

Render with a mutation function and its reactive result:

```marko
import { createClient } from "./apollo-client.marko";
import { ADD_DOG } from "./add-dog.js";

<use-mutation/addDog|result| client=() => createClient() mutation=() => ADD_DOG>
  <button
    type="button"
    disabled=result.loading
    onClick() {
      void addDog({
        variables: { name: "Buck" },
      }).catch(() => {});
    }
  >
    Add dog
  </button>

  <if=result.error>${result.error.message}</if>
  <else-if=result.data>Added ${result.data.addDog.name}</else-if>
</use-mutation>
```

| Input      | Type                              | Description                                 |
| ---------- | --------------------------------- | ------------------------------------------- |
| `client`   | `() => ApolloClient \| undefined` | Required target-specific client getter.     |
| `mutation` | `() => MutateOptions["mutation"]` | Required inline document getter.            |
| `content`  | `Marko.Body<[Result]>`            | Optional body receiving reactive state.     |
| `...`      | Mutation options without document | Default options merged into each execution. |

The tag variable calls `ApolloClient.mutate`. It accepts per-execution mutation
options, merges their variables with defaults supplied to the tag, and returns
Apollo's mutation Promise. Rejections remain rejections, so event handlers that
rely on the reactive `result.error` should explicitly handle the Promise as
shown above.

The optional body parameter contains:

| Field     | Type                              | Description                              |
| --------- | --------------------------------- | ---------------------------------------- |
| `called`  | `boolean`                         | Whether the mutation has been called.    |
| `loading` | `boolean`                         | Whether its latest execution is pending. |
| `data`    | `MaybeMasked<TData> \| undefined` | The latest mutation data.                |
| `error`   | `ErrorLike \| undefined`          | The latest mutation error.               |
| `reset`   | `() => void`                      | Restore the initial idle result.         |

The tag renders immediately and never executes a mutation during SSR. Client
and mutation getters are resolved only when `mutate` is called, keeping both
non-serializable values out of resumed state. Only the latest execution updates
the result; resetting, replacing, or removing the tag prevents an older Promise
from publishing stale state. When result UI is unnecessary, omit the body:

```marko
<use-mutation/addDog client=() => createClient() mutation=() => ADD_DOG/>
```

### `<use-subscription>`

Render server-resumable loading state followed by subscription events:

```marko
import { createClient } from "./apollo-client.marko";
import { DOG_UPDATED } from "./dog-updated.js";

<use-subscription|result|
  client=() => createClient()
  subscription=() => DOG_UPDATED
  variables={ name: "Buck" }
>
  <if=result.loading>Waiting for the first update…</if>
  <else-if=result.error>${result.error.message}</else-if>
  <else><img src=result.data?.dogUpdated.displayImage></else>
</use-subscription>
```

| Input          | Type                              | Description                         |
| -------------- | --------------------------------- | ----------------------------------- |
| `client`       | `() => ApolloClient \| undefined` | Required browser client getter.     |
| `subscription` | `() => SubscribeOptions["query"]` | Required document getter.           |
| `content`      | `Marko.Body<[Result]>`            | Required body receiving the result. |
| `...`          | `Omit<SubscribeOptions, "query">` | Remaining subscription options.     |

Subscriptions never start during SSR. The tag initially renders a serializable
result with `loading: true`. After browser resumption, it calls both getters and
subscribes with `ApolloClient.subscribe`. Events update the body parameter with
`loading: false`; stream errors set `error` instead of rejecting a Marko async
boundary. Changing inputs returns the result to its loading state while the new
stream starts.

The result extends Apollo's
`ApolloClient.SubscribeResult<MaybeMasked<TData>>`, containing `data`, optional
`error`, and optional `extensions`, with a `loading` boolean. The tag
unsubscribes when its inputs change or it leaves the document. The supplied
Apollo Client must configure a subscription-capable link.

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

Apollo Client, observable query, and cache-watch instances, as well as GraphQL
`DocumentNode` objects, cannot cross Marko's server-resume serialization
boundary. `<use-query>`, `<use-fragment>`, and `<use-subscription>` invoke their
client and document getters separately in each runtime where they are needed. When `client()`
returns an Apollo Client on the server, `<use-query>` awaits its query,
serializes only the result, then seeds the browser cache before starting
`watchQuery`.

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

`<use-fragment>` synchronously reads a server client's cache when one is
available and serializes only its plain result. It reconstructs the cache watch
in the browser; it does not serialize the watch or automatically transfer the
rest of a standalone server cache. A surrounding `<use-query>` seeds its query
result into the browser cache, which publishes through the fragment watch.

`<use-subscription>` renders `{ loading: true, data: undefined }` during SSR but
starts its stream only in the browser. A pending server Promise would keep the
HTML stream open and prevent resumption, so the browser script instead updates
the serialized result state when the stream emits, errors, or completes.
