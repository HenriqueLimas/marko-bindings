# Marko design decisions

Living notes for non-obvious API choices caused by Marko's rendering and
lifecycle model. Keep entries short: what we tried, why it failed, and the rule
future bindings should follow.

## Pass dependencies explicitly

- **Tried:** An `<apollo-provider>` wrote the client to `$global`, and
  `<use-apollo-client>` read it. A microtask was needed because provider scripts
  run after rendering and mounting.
- **Ended with:** `<use-query>` requires a `client` input.
- **Rule:** Prefer inputs and tag variables over mutable `$global` state.
  `$global` may be populated at the render boundary, but tags should not use it
  as a dependency-injection container.

## Put server-fetched content inside its async boundary

- **Tried:** `<use-query/result .../>` returned query state for markup rendered
  by its parent. That worked for browser queries, but the parent markup was
  outside the tag's server `<await>` boundary.
- **Ended with:** `<use-query|result| ...>...</use-query>` requires content and
  passes only settled results as a body parameter. Loading is represented by its
  Promise and the surrounding Marko `<@placeholder>`; background loading keeps
  the last settled content visible. The tag returns no tag variable.
- **Rule:** A data tag that suspends during server rendering must own the content
  consuming that data so it can place the content inside its async boundary.
  Data known by the route should still start in the route handler to avoid
  nested render-time waterfalls.

## Keep non-serializable dependencies outside server resume state

- **Constraint:** `ApolloClient` and `ObservableQuery` are class instances, and
  parsed GraphQL `DocumentNode` objects also contain state that Marko cannot
  serialize across the server-resume boundary.
- **Tried:** Creating an `ApolloClient` in a template `<const>`, and passing a
  module export directly as `client=client`, including through a `client import`.
  Moving `watchQuery` and input access into `<use-query>`'s browser script still
  did not make the parent import cross the custom-tag input boundary. Apollo and
  the instance remained absent from the browser bundle. An `ssrMode` client also
  stayed unused while all query work lived in a browser `<script>`. Wrapping a
  target-specific getter in a parent `<const>` fetched during SSR, but Marko
  omitted the getter from the resumed child input.
- **Ended with:** Both runtime modules export `createClient()`. The required
  inline getter selects the server or browser factory; the server returns a
  fresh `ssrMode` client and the browser factory memoizes its singleton.
  `<use-query>` awaits `client.query()` on the server, serializes only its plain
  result, seeds the browser cache, and starts `watchQuery` in its browser script.
  Queries are likewise exported from `.marko` modules as getter functions and
  invoked through an inline `query=() => GET_QUERY()` wrapper. Passing an
  imported getter directly was still classified as server-only and disappeared
  from the resumed child input. Registering exported arrow functions with a
  module `<return>` made their IDs serializable, but the browser entry still
  omitted their implementations, so they resumed as `undefined`. Direct client
  and parsed-query inputs remain intentionally unsupported.
- **Rule:** Hide target-specific, non-serializable dependencies behind an inline
  or Marko-module getter. Server work must be explicitly awaited and only plain
  results may cross the resume boundary; `ssrMode` does not start queries.

## Complete SSR before browser-only async work

- **Tried:** When no server Apollo Client was supplied, returning a
  never-resolving Promise kept the Marko `<@placeholder>` visible.
- **Problem:** The unresolved server `<await>` also kept the HTML stream open, so
  the browser never reached Marko's resume code and could not start its query.
- **Ended with:** `<use-query>` has one `client` getter. It may return a
  request-scoped client on the server to enable SSR, or `undefined` to create no
  server async branch. A browser `<script>` calls the same getter after
  resumption and places `client.query()` into reactive state, activating the
  same `<await>` and placeholder.
- **Rule:** Do not represent browser-only work with a permanently pending server
  Promise. Finish SSR, then create the Promise from an explicitly client-side
  effect.

## Scope cleanup to what the tag owns

- **Ended with:** `<use-query>` unsubscribes and stops its `ObservableQuery` when
  its inputs change or the tag leaves the document. Its script captures that
  query for cleanup instead of rereading a reactive binding that may have
  changed. It does not stop the shared `ApolloClient` supplied by the
  application.
- **Rule:** A binding cleans up subscriptions and instances it creates, but not
  dependencies passed in by its caller. Cleanup closures must capture the
  resource owned by their specific reactive script run.

## Keep mutations event driven

- **Ended with:** `<use-mutation>` renders immediately, returns `mutate` as its
  tag variable, and passes reactive result state to an optional body. It never
  starts a mutation during SSR. `mutate` resolves the client and mutation
  document only when called, and the result intentionally omits the
  non-serializable client instance.
- **Rule:** Do not suspend rendering for work that begins from a browser event.
  Keep the trigger inside the tag's resumable scope, publish plain result state,
  and ignore late results after reset, replacement, or cleanup.

## Adding a decision

```md
## Short decision

- **Tried:** The rejected approach.
- **Ended with:** The current approach.
- **Rule:** The reusable guidance for future bindings.
```
