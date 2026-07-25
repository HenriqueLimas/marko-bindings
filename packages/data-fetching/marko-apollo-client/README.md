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

Create an Apollo Client and pass it to each query:

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

<use-query/result client=client query=GET_DOG variables={ name: input.name }/>

<if=result.loading>Loading…</if>
<else-if=result.error>${result.error.message}</else-if>
<else><img src=result.data?.dog.displayImage></else>
```

`<use-query>` requires an Apollo Client and accepts Apollo's complete
`ApolloClient.WatchQueryOptions` shape. This includes `variables`,
`fetchPolicy`, `errorPolicy`, polling, partial-data, and network-status options.

See the runnable
[Marko Run and Apollo Server example](../../../examples/apollo-client/README.md)
for a complete application with a local `/gql` route.

## API

### `<use-query>`

Return a reactive query result:

```marko
<use-query/result client=client query=GET_DOG variables={ name: "Buck" }/>

<if=result.loading>Loading…</if>
<else>${result.data?.dog.displayImage}</else>
```

| Input    | Type                             | Description                     |
| -------- | -------------------------------- | ------------------------------- |
| `client` | `ApolloClient`                   | Client that observes the query. |
| `...`    | `ApolloClient.WatchQueryOptions` | Apollo watch-query options.     |

The tag return value is `ObservableQuery.Result<MaybeMasked<TData>>`. Use the
same client directly when imperative Apollo Client methods are needed.

The tag:

1. creates an Apollo `watchQuery` from the provided client;
2. publishes its current result;
3. reacts to cache and network result updates; and
4. unsubscribes and stops the observable when its inputs change or it leaves the
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

Apollo Client and `ObservableQuery` instances are class instances and cannot
cross Marko's server-resume serialization boundary. Use this initial binding
with client-rendered query state. For server data, load it in a Marko Run route
handler and render the returned promise with `<await>`, then initialize a
separate browser client for later client-side queries.
