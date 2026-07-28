# Apollo Client with Marko Run

This example uses the `marko-apollo-client` binding in a Marko Run application.
The pages use an Apollo Server exposed by the same application at `/gql`:

- `/` loads the query with a request-scoped server client.
- `/client-only` returns no client on the server and loads through the browser
  client after resumption.
- `/mutation` queries during SSR, executes a mutation from a resumed browser
  event, and refetches the watched query.
- `/subscription` renders loading state during SSR, then starts a browser
  subscription after resumption.

The root `+layout.marko` owns the shared HTML shell and styles. Each page sets
CSS custom properties on its wrapper for its accent, link, surface, and detail
colors.

```sh
pnpm --filter @marko-bindings/example-apollo-client dev
```

Open <http://localhost:3000> for the SSR page,
<http://localhost:3000/client-only> for the client-only page, or
<http://localhost:3000/mutation> for the mutation page. The subscription example
is at <http://localhost:3000/subscription>. Open
<http://localhost:3000/gql> for Apollo Sandbox.

The page passes one target-specific client getter and one inline query getter to
`<use-query>`. GraphQL documents are ordinary TypeScript module constants; only
the client factories need `.marko` modules for target-specific `server` and
`client` declarations. On the server, the client getter creates an `ssrMode`
Apollo Client and executes directly against the local Apollo Server. In the browser,
the same getter returns a separate memoized client that receives the serialized
query result before `watchQuery` starts. Neither client instance nor the parsed
GraphQL document crosses Marko's resume boundary. The query body receives only
settled results; its surrounding Marko `<@placeholder>` owns the loading UI.

The client-only page uses `createClientOnly()`, whose server implementation
returns `undefined`. The server finishes without an async query; after
resumption, the same `client` input resolves to the browser client, which sends
the initial request to `/gql` and uses the same placeholder boundary.

The mutation page nests `<use-mutation>` inside `<use-query>`. The initial book
list is server-rendered, while the mutation tag returns its resumable function
and passes reactive state to its body. Clicking the button adds a book, refetches
the watched `Books` query, and updates the same list. No mutation starts during
SSR, and neither tag serializes the Apollo Client or parsed documents.

The subscription page uses a browser-only Apollo Link that emits an incrementing
value. `<use-subscription>` renders serializable loading state during SSR, starts
the stream only after Marko resumes, and updates the same body parameter for
later events.

The GraphQL endpoint is a Marko Run `+handler.ts` that adapts its web-standard
request and response objects to the same Apollo Server.
