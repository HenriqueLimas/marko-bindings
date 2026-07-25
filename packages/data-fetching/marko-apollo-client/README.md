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

Create an Apollo Client, provide it to the current Marko render, and observe a
query:

```marko
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  gql,
} from "marko-apollo-client";

static const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({ uri: "/graphql" }),
});

static const GET_DOG = gql(`
    query GetDog($name: String!) {
      dog(name: $name) {
        id
        displayImage
      }
    }
  `);

<apollo-provider client=client>
  <use-query|result, query| query=GET_DOG variables={ name: input.name }>
    <if=result.loading>Loading…</if>
    <else-if=result.error>${result.error.message}</else-if>
    <else>
      <img src=result.data?.dog.displayImage>
      <button onClick() {
        query.refetch();
      }>
        Refresh
      </button>
    </else>
  </use-query>
</apollo-provider>
```

`<use-query>` accepts Apollo's complete `ApolloClient.WatchQueryOptions` shape.
This includes `variables`, `fetchPolicy`, `errorPolicy`, polling, partial-data,
and network-status options.

## API

### `<apollo-provider>`

```marko
<apollo-provider client=client>...</apollo-provider>
```

| Input     | Type           | Description                                         |
| --------- | -------------- | --------------------------------------------------- |
| `client`  | `ApolloClient` | Client stored as `$global.apolloClient`.            |
| `content` | `Marko.Body`   | Optional content rendered after setting the client. |

The tag returns the provided client. It does not call `client.stop()` because
the application owns the client and may use it across multiple query tags.

`$global` belongs to the current Marko render, so server applications should use
a request-scoped client rather than sharing one cache between users. A client
can also be supplied directly when invoking a template:

```js
await Page.render({
  $global: { apolloClient: client },
});
```

### `<use-query>`

Return a reactive query result:

```marko
<use-query/result query=GET_DOG variables={ name: "Buck" }/>

<if=result.loading>Loading…</if>
<else>${result.data?.dog.displayImage}</else>
```

Render body content with both the result and its `ObservableQuery`:

```marko
<use-query|result, query| query=GET_DOG variables={ name: "Buck" }>
  <button onClick() {
    query.refetch();
  }>
    Refresh ${result.data?.dog.displayImage}
  </button>
</use-query>
```

The first body parameter and tag return value are
`ObservableQuery.Result<MaybeMasked<TData>>`. The second body parameter exposes
Apollo's `ObservableQuery<TData, TVariables>` methods, including `refetch`,
`fetchMore`, `subscribeToMore`, and polling controls.

The tag:

1. reads the client from `$global.apolloClient`;
2. creates an Apollo `watchQuery`;
3. publishes its current result;
4. reacts to cache and network result updates; and
5. unsubscribes and stops the observable when its inputs change or it leaves the
   document.

Rendering `<use-query>` without an `<apollo-provider>` or a directly configured
`$global.apolloClient` throws an error explaining how to provide one.

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

Apollo Client and `ObservableQuery` instances are class instances and cannot
cross Marko's server-resume serialization boundary. Use this initial binding
with client-rendered query state. For server data, load it in a Marko Run route
handler and render the returned promise with `<await>`, then initialize
`<apollo-provider>` for later client-side queries.
