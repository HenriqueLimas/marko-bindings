# @marko-bindings/tanstack-query

TanStack Query bindings for Marko 6.

The package owns `@tanstack/query-core` and re-exports its complete public API,
so applications only need to install `@marko-bindings/tanstack-query`; `marko` remains a
peer dependency.

## Install

```sh
pnpm add @marko-bindings/tanstack-query
```

## Usage

Define query options in a regular TypeScript module. This keeps the query
function statically reconstructable in both server and browser bundles:

```ts
import { getDog } from "./dog-api.js";

export const dogQuery = (name: string) => ({
  queryKey: ["dog", name],
  queryFn: ({ signal }: { signal: AbortSignal }) => getDog(name, { signal }),
  staleTime: 30_000,
});
```

Create request-scoped server clients and reuse one browser client from a Marko
module:

```marko
import { QueryClient } from "@marko-bindings/tanstack-query";

client let browserClient: QueryClient | undefined;

server function createServerClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

client function createBrowserClient() {
  return (browserClient ??= new QueryClient());
}

export const createClient =
  typeof createServerClient !== "undefined"
    ? createServerClient
    : createBrowserClient;
```

Initialize the client once, then pass each query through an inline getter. The
body renders inside Marko's async boundary and receives reactive settled query
results:

```marko
import { createClient } from "./query-client.marko";
import { dogQuery } from "./queries.js";

<init-query-client=() => createClient()/>

<try>
  <await-query|result| query=() => dogQuery(input.name)>
    <if=result.error>${result.error.message}</if>
    <else><img src=result.data?.image alt=result.data?.name></else>
  </await-query>

  <@placeholder>Loading…</@placeholder>
  <@catch|error|>${String(error)}</@catch>
</try>
```

Returning a client on the server enables SSR. Returning `undefined` there skips
the server query and starts it after browser resumption; the getter must return
a client in the browser.

## API

### `<init-query-client>`

```marko
<init-query-client/client=() => createClient()/>
```

Calls the required `value` getter during server rendering and again in the
browser, stores the runtime-local result as the render-wide default, and returns
it. Render the initializer before queries that omit `client`. A later
initializer replaces the default for subsequent queries; an explicit `client`
input always takes precedence.

### `<await-query>`

| Input     | Type                                  | Description                                   |
| --------- | ------------------------------------- | --------------------------------------------- |
| `client`  | `() => QueryClient \| undefined`      | Optional override for the initialized client. |
| `query`   | `() => QueryObserverOptions`          | Required inline query-options getter.         |
| `content` | `Marko.Body<[Result<TData, TError>]>` | Required body receiving a settled result.     |

The query getter accepts the full TanStack `QueryObserverOptions` shape,
including `queryKey`, `queryFn`, `select`, stale-time, retry, and refetch
configuration. Keep query definitions in regular TypeScript modules and invoke
them from an inline getter so Marko never needs to serialize their functions.

`Result` is TanStack's `QueryObserverResult` without `promise` and `refetch`,
which cannot cross Marko's server-resume boundary. Use the explicit client for
imperative operations such as `invalidateQueries` and `refetchQueries`.
Initial loading belongs to the surrounding `<try>`/`<@placeholder>` boundary.
Background fetches keep the last settled body visible and publish the next
result when fetching settles. Query errors are published as results by default;
`throwOnError` or `suspense` sends them to the surrounding `<@catch>` boundary.

The tag:

1. resolves a request-local client and awaits the query during SSR when one is
   available;
2. otherwise starts the initial query after browser resumption;
3. serializes only a settled observer view and TanStack's dehydrated state for
   that query;
4. hydrates the browser cache before creating a `QueryObserver`;
5. publishes settled cache and refetch updates reactively; and
6. unsubscribes the observer and balances `QueryClient.mount()` on cleanup.

Client and query ownership stay with the application. The tag never clears or
destroys the initialized or explicitly supplied `QueryClient`.

### `<const-mutation>`

Define mutation options in a regular TypeScript module, then pass them through
an inline getter:

```ts
export const addDogMutation = (apiUrl: string) => ({
  mutationKey: ["add-dog"],
  mutationFn: async (name: string) => {
    const response = await fetch(apiUrl, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return response.json() as Promise<{ id: string; name: string }>;
  },
});
```

```marko
<const-mutation/[addDog, result] mutation=() => addDogMutation(input.apiUrl)/>
<button
  type="button"
  disabled=result.isPending
  onClick() {
    void addDog("Buck").catch(() => {});
  }
>
  Add dog
</button>

<if=result.isError>${result.error.message}</if>
<else-if=result.isSuccess>Added ${result.data.name}</else-if>
```

| Input      | Type                                        | Description                                   |
| ---------- | ------------------------------------------- | --------------------------------------------- |
| `client`   | `() => QueryClient \| undefined`            | Optional override for the initialized client. |
| `mutation` | `() => MutationObserverOptions<TData, ...>` | Required inline mutation-options getter.      |

The tag returns a `[mutate, result]` tuple. The first entry has TanStack's
`MutateFunction` signature: it accepts variables and optional per-execution
callbacks, then returns the mutation Promise. Rejections remain rejections, so
handlers that render `result.error` should handle the Promise as shown above.
The second entry is TanStack's reactive `MutationObserverResult` without its
upstream `mutate` and `reset` methods; the binding adds its own resumable
`reset()` function. It includes `status`, `data`, `error`, `variables`,
`isIdle`, `isPending`, `isError`, `isSuccess`, retry state, and mutation
context.

The tag renders an idle result immediately and never executes a mutation during
SSR. It resolves the client and mutation-options getters only when `mutate` is
called, then delegates execution, callbacks, retries, and latest-call state to
a `MutationObserver`. It replaces that observer when a later call resolves a
new client, and releases it while balancing the client's mount when the tag
leaves the document. Neither the initialized nor explicitly supplied client is
cleared or destroyed. Omit the
second tuple entry when result UI is unnecessary:

```marko
<const-mutation/[addDog] mutation=() => addDogMutation(input.apiUrl)/>
```

## Upstream exports

The package re-exports the complete `@tanstack/query-core` entrypoint:

```ts
import {
  QueryCache,
  QueryClient,
  QueryObserver,
  dehydrate,
  hydrate,
} from "@marko-bindings/tanstack-query";
```
