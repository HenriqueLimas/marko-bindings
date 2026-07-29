# @marko-bindings/apollo-client

Apollo Client bindings for Marko 6.

The package owns `@apollo/client` and its required `graphql` and `rxjs`
dependencies, and re-exports the complete `@apollo/client` entrypoint. An
application only needs to install `@marko-bindings/apollo-client`; `marko` remains a peer
dependency.

## Install

```sh
pnpm add @marko-bindings/apollo-client
```

## Usage

Create a browser Apollo Client and a request-scoped server client with
`ssrMode: true`:

```ts
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
} from "@marko-bindings/apollo-client";

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
import { gql, type TypedDocumentNode } from "@marko-bindings/apollo-client";

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
constant from its TypeScript module. `<await-query>` always receives the document
through an inline getter and a body parameter containing the reactive result.
GraphQL documents do not need `.marko` modules; reserve those for values such as
client factories that use Marko's `server` and `client` declarations.

```marko
import { createClient } from "./apollo-client.marko";
import { GET_DOG } from "./get-dog.js";

<init-apollo-client=() => createClient()/>

<try>
  <await-query|result| query=() => GET_DOG variables={ name: input.name }>
    <if=result.error>${result.error.message}</if>
    <else><img src=result.data?.dog.displayImage></else>
  </await-query>

  <@placeholder>Loading…</@placeholder>
  <@catch|error|>${String(error)}</@catch>
</try>
```

`<init-apollo-client>` installs the getter's result as the render-wide default
client. `<await-query>` requires a `query` getter and a parameterized body; its
`client` getter is only needed to override that default. A client getter may
return an Apollo Client or `undefined`. Returning a client on the server enables
SSR; returning `undefined` there defers the initial request to the browser. The
getter must return a client in the browser. The tag accepts the rest of Apollo's
`ApolloClient.WatchQueryOptions` shape. The getters resolve runtime-local values
without asking Marko to serialize either the client or parsed GraphQL document.
If a required browser getter is missing, the tag logs an error that can be
handled by the surrounding `<try>`.

See the runnable
[Marko Run and Apollo Server example](../../../examples/apollo-client/README.md)
for a complete application with a local `/gql` route.

## API

### `<init-apollo-client>`

```marko
<init-apollo-client/client=() => createClient()/>
```

Calls the required `value` getter during server rendering and again in the
browser, stores the runtime-local result on a symbol-keyed `$global` property,
and returns it. Render this tag before bindings that omit `client`. The default
is render-wide rather than lexically scoped: a later initializer replaces it
for subsequent bindings. An explicit `client` input always takes precedence.

### `<await-query>`

Render with a reactive query result:

```marko
<await-query|result| query=() => GET_DOG variables={ name: "Buck" }>
  ${result.data?.dog.displayImage}
</await-query>
```

| Input     | Type                               | Description                                   |
| --------- | ---------------------------------- | --------------------------------------------- |
| `client`  | `() => ApolloClient \| undefined`  | Optional override for the initialized client. |
| `query`   | `() => WatchQueryOptions["query"]` | Required inline document getter.              |
| `content` | `Marko.Body<[Result]>`             | Required body receiving a settled result.     |
| `...`     | `Omit<WatchQueryOptions, "query">` | Remaining Apollo watch-query options.         |

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

The application still owns the initialized client. Server applications should
have its getter create a request-scoped client rather than sharing one cache
between users.

### `<const-fragment>`

Render a reactive view of one normalized entity in the Apollo cache:

```marko
import { createClient } from "./apollo-client.marko";
import { DOG_FIELDS } from "./dog-fields.js";

<const-fragment/result
  fragment=() => DOG_FIELDS
  from={ __typename: "Dog", id: input.id }
/>
<if=result.complete>${result.data.name}</if>
<else>Some dog fields are missing</else>
```

| Input          | Type                                     | Description                                   |
| -------------- | ---------------------------------------- | --------------------------------------------- |
| `client`       | `() => ApolloClient \| undefined`        | Optional override for the initialized client. |
| `fragment`     | `() => WatchFragmentOptions["fragment"]` | Required inline fragment getter.              |
| `from`         | Entity, cache ID, array, or `null`       | Required normalized cache identifier(s).      |
| `fragmentName` | `string`                                 | Selects one of multiple fragments.            |
| `variables`    | `OperationVariables`                     | Variables used by the fragment.               |
| `optimistic`   | `boolean`                                | Includes optimistic data; defaults true.      |

The tag variable is Apollo's reactive `WatchFragmentResult`, containing `data`,
`dataState`, `complete`, and a `missing` tree for partial data. The tag is a
lightweight cache binding: it never sends a network request. Use `<await-query>`
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

### `<const-mutation>`

Render with a mutation function and its reactive result:

```marko
import { createClient } from "./apollo-client.marko";
import { ADD_DOG } from "./add-dog.js";

<const-mutation/[addDog, result] mutation=() => ADD_DOG/>
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
```

| Input      | Type                              | Description                                   |
| ---------- | --------------------------------- | --------------------------------------------- |
| `client`   | `() => ApolloClient \| undefined` | Optional override for the initialized client. |
| `mutation` | `() => MutateOptions["mutation"]` | Required inline document getter.              |
| `...`      | Mutation options without document | Default options merged into each execution.   |

The tag returns a `[mutate, result]` tuple. Destructure either or both entries
and choose application-specific names, such as `/[addToCart]` or
`/[addToCart, addToCartResult]`. The first entry calls `ApolloClient.mutate`,
accepts per-execution mutation options, merges their variables with defaults
supplied to the tag, and returns Apollo's mutation Promise. Rejections remain
rejections, so event handlers that rely on the reactive `result.error` should
explicitly handle the Promise as shown above.

The reactive result contains:

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
from publishing stale state. When result UI is unnecessary, omit the second
tuple entry:

```marko
<const-mutation/[addDog] mutation=() => ADD_DOG/>
```

### `<const-subscription>`

Render server-resumable loading state followed by subscription events:

```marko
import { createClient } from "./apollo-client.marko";
import { DOG_UPDATED } from "./dog-updated.js";

<const-subscription/result
  subscription=() => DOG_UPDATED
  variables={ name: "Buck" }
/>
<if=result.loading>Waiting for the first update…</if>
<else-if=result.error>${result.error.message}</else-if>
<else><img src=result.data?.dogUpdated.displayImage></else>
```

| Input          | Type                              | Description                                   |
| -------------- | --------------------------------- | --------------------------------------------- |
| `client`       | `() => ApolloClient \| undefined` | Optional override for the initialized client. |
| `subscription` | `() => SubscribeOptions["query"]` | Required document getter.                     |
| `...`          | `Omit<SubscribeOptions, "query">` | Remaining subscription options.               |

Subscriptions never start during SSR. The tag initially renders a serializable
result with `loading: true`. After browser resumption, it calls both getters and
subscribes with `ApolloClient.subscribe`. Events update the returned tag variable
with `loading: false`; stream errors set `error` instead of rejecting a Marko async
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
} from "@marko-bindings/apollo-client";
```

## Server rendering

Apollo Client, observable query, and cache-watch instances, as well as GraphQL
`DocumentNode` objects, cannot cross Marko's server-resume serialization
boundary. `<init-apollo-client>` reconstructs the default client independently
in each runtime; explicit client inputs do the same. Query, fragment, and
subscription tags also invoke their document getters in each runtime. When the resolved client
returns an Apollo Client on the server, `<await-query>` awaits its query,
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

`<const-fragment>` synchronously reads a server client's cache when one is
available and serializes only its plain result. It reconstructs the cache watch
in the browser; it does not serialize the watch or automatically transfer the
rest of a standalone server cache. A surrounding `<await-query>` seeds its query
result into the browser cache, which publishes through the fragment watch.

`<const-subscription>` renders `{ loading: true, data: undefined }` during SSR but
starts its stream only in the browser. A pending server Promise would keep the
HTML stream open and prevent resumption, so the browser script instead updates
the serialized result state when the stream emits, errors, or completes.
