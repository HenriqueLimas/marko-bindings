# Apollo Client with Marko Run

This example uses the `marko-apollo-client` binding in a Marko Run application.
The pages use an Apollo Server exposed by the same application at `/gql`:

- `/` loads the query with a request-scoped server client.
- `/fragments` queries books and binds each result to a reactive cache fragment.
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

Open <http://localhost:3000> for the SSR query page,
<http://localhost:3000/fragments> for the fragment cache page,
<http://localhost:3000/client-only> for the client-only page, or
<http://localhost:3000/mutation> for the mutation page. The subscription example
is at <http://localhost:3000/subscription>. Open
<http://localhost:3000/gql> for Apollo Sandbox.

Each page passes its target-specific client getter once to
`<init-apollo-client>`, then query, fragment, mutation, and subscription tags use
that render-wide default. GraphQL documents are ordinary TypeScript module
constants; only the client factories need `.marko` modules for target-specific
`server` and `client` declarations. On the server, the client runs in `ssrMode`
and executes directly against the local Apollo Server. In the browser, the same
getter returns a separate memoized client that receives the serialized query
result before `watchQuery` starts. The query body receives only settled results;
its surrounding Marko `<@placeholder>` owns the loading UI.

The fragment page composes `<await-query>` and `<const-fragment>`. Parsed query and
fragment `DocumentNode` values require getters because they cannot cross Marko's
resume boundary. The fragment's `from` input does not: each book is plain query
data, so the page passes `from=book` directly and Marko serializes it for
resumption. The initialized client is shared by the page's query and fragment
tags in each runtime, so the server fragment reads the query-populated cache and
the resumed browser fragment watches the same browser cache. This exercises the
plain `from` value across resumption while keeping client instances and parsed
documents out of resume state.

The client-only page uses `createClientOnly()`, whose server implementation
returns `undefined`. The server finishes without an async query; after
resumption, `<init-apollo-client>` resolves the browser client, and the query
uses that default to send its initial request to `/gql` through the same
placeholder boundary.

The mutation page nests `<const-mutation>` inside `<await-query>`. The initial book
list is server-rendered, while the mutation tag returns its resumable function
and reactive state as a tuple. Clicking the button adds a book, refetches
the watched `Books` query, and updates the same list. No mutation starts during
SSR, and neither tag serializes the Apollo Client or parsed documents.

The subscription page uses a browser-only Apollo Link that emits an incrementing
value. `<const-subscription>` returns serializable loading state during SSR,
starts the stream only after Marko resumes, and updates the same reactive tag
variable for later events.

The GraphQL endpoint is a Marko Run `+handler.ts` that adapts its web-standard
request and response objects to the same Apollo Server.
