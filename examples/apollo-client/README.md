# Apollo Client with Marko Run

This example uses the `marko-apollo-client` binding in a Marko Run application.
Both pages query an Apollo Server exposed by the same application at `/gql`:

- `/` loads the query with a request-scoped server client.
- `/client-only` returns no client on the server and loads through the browser
  client after resumption.

```sh
pnpm --filter @marko-bindings/example-apollo-client dev
```

Open <http://localhost:3000> for the SSR page,
<http://localhost:3000/client-only> for the client-only page, or
<http://localhost:3000/gql> for Apollo Sandbox.

The page passes one target-specific client getter and one query getter to
`<use-query>`. On the server, the client getter creates an `ssrMode` Apollo
Client and executes directly against the local Apollo Server. In the browser,
the same getter returns a separate memoized client that receives the serialized
query result before `watchQuery` starts. Neither client instance nor the parsed
GraphQL document crosses Marko's resume boundary. The query body receives only
settled results; its surrounding Marko `<@placeholder>` owns the loading UI.

The client-only page uses `createClientOnly()`, whose server implementation
returns `undefined`. The server finishes without an async query; after
resumption, the same `client` input resolves to the browser client, which sends
the initial request to `/gql` and uses the same placeholder boundary.

The GraphQL endpoint is a Marko Run `+handler.ts` that adapts its web-standard
request and response objects to the same Apollo Server.
