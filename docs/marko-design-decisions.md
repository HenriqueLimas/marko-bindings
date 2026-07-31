# Marko design decisions

Living notes for non-obvious API choices caused by Marko's rendering and
lifecycle model. Keep entries short: what we tried, why it failed, and the rule
future bindings should follow.

## Name bindings by Marko semantics

- **Tried:** React-style `use-*` names even though custom tags are declarations,
  not hooks.
- **Ended with:** `await-*` tags own asynchronous content, `const-*` tags return
  reactive read-only variables, and `let-*` tags return writable variables.
- **Rule:** Name a binding for the Marko behavior visible to its caller rather
  than the equivalent integration primitive from another framework.

## Initialize render-wide dependency defaults with getters

- **Tried:** An `<apollo-provider>` accepted a client instance and only wrote it
  to `$global` in a browser script. The non-serializable input could not resume,
  and consumers rendered before the script populated the global.
- **Ended with:** Each context-style binding has an initializer whose inline
  getter writes a symbol-keyed `$global` value during server rendering and
  reconstructs it in a browser script. Consumer tags prefer an explicit input
  but otherwise read that render-wide default.
- **Rule:** A `$global` dependency default must use a package-namespaced
  `Symbol.for` key and a target-reconstructable getter. Render the initializer
  before its consumers, retain explicit inputs as overrides, and do not present
  the mutable default as lexically scoped context.

## Put server-fetched content inside its async boundary

- **Tried:** `<await-query/result .../>` returned query state for markup rendered
  by its parent. That worked for browser queries, but the parent markup was
  outside the tag's server `<await>` boundary.
- **Ended with:** `<await-query|result| ...>...</await-query>` requires content and
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
  Moving `watchQuery` and input access into `<await-query>`'s browser script still
  did not make the parent import cross the custom-tag input boundary. Apollo and
  the instance remained absent from the browser bundle. An `ssrMode` client also
  stayed unused while all query work lived in a browser `<script>`. Wrapping a
  target-specific getter in a parent `<const>` fetched during SSR, but Marko
  omitted the getter from the resumed child input.
- **Ended with:** Both runtime modules export `createClient()`. The required
  inline getter selects the server or browser factory; the server returns a
  fresh `ssrMode` client and the browser factory memoizes its singleton.
  `<await-query>` awaits `client.query()` on the server, serializes only its plain
  result, seeds the browser cache, and starts `watchQuery` in its browser script.
  GraphQL documents are exported as constants from regular TypeScript modules
  and returned through inline `query=() => GET_QUERY` wrappers, bundling the
  parsed document in each target without serializing it. Passing an
  imported getter directly was still classified as server-only and disappeared
  from the resumed child input. Registering exported arrow functions with a
  module `<return>` made their IDs serializable, but the browser entry still
  omitted their implementations, so they resumed as `undefined`. Direct client
  and parsed-query inputs remain intentionally unsupported.
- **Rule:** Export target-agnostic GraphQL documents from regular TypeScript
  modules and reference them through inline getters. Reserve Marko modules for
  target-specific dependencies such as client factories. Server work must be
  explicitly awaited and only plain results may cross the resume boundary;
  `ssrMode` does not start queries.

## Complete SSR before browser-only async work

- **Tried:** When no server Apollo Client was supplied, returning a
  never-resolving Promise kept the Marko `<@placeholder>` visible.
- **Problem:** The unresolved server `<await>` also kept the HTML stream open, so
  the browser never reached Marko's resume code and could not start its query.
- **Ended with:** `<await-query>` has one `client` getter. It may return a
  request-scoped client on the server to enable SSR, or `undefined` to create no
  server async branch. A browser `<script>` calls the same getter after
  resumption and places `client.query()` into reactive state, activating the
  same `<await>` and placeholder.
- **Rule:** Do not represent browser-only work with a permanently pending server
  Promise. Finish SSR, then create the Promise from an explicitly client-side
  effect.

## Scope cleanup to what the tag owns

- **Ended with:** `<await-query>` unsubscribes and stops its `ObservableQuery` when
  its inputs change or the tag leaves the document. Its script captures that
  query for cleanup instead of rereading a reactive binding that may have
  changed. It does not stop the shared `ApolloClient` supplied by the
  application.
- **Rule:** A binding cleans up subscriptions and instances it creates, but not
  dependencies passed in by its caller. Cleanup closures must capture the
  resource owned by their specific reactive script run.

## Keep mutations event driven

- **Ended with:** `<const-mutation>` renders immediately and returns a
  destructurable `[mutate, result]` tuple. It never starts a mutation during SSR.
  `mutate` resolves non-serializable clients, documents, and option functions
  only when called. Apollo publishes plain state directly; TanStack lazily owns
  a `MutationObserver`, but strips its methods from reactive state and releases
  the observer when the tag leaves the document.
- **Rule:** Do not suspend rendering for work that begins from a browser event.
  Keep the trigger inside the tag's resumable scope, publish plain result state,
  and ignore late results after reset, replacement, or cleanup.

## Represent browser-only readiness as serializable state

- **Tried:** A never-settling server Promise that the browser would replace with
  the first subscription event's Promise. Marko kept the server stream open, so
  the browser could not resume to replace it.
- **Ended with:** `<const-subscription>` renders a plain `{ loading, data, error }`
  result during SSR. After resumption it starts the browser subscription and
  updates that state for events, errors, and completion.
- **Rule:** Browser-only streams should expose serializable loading state during
  SSR, then start after resumption and unsubscribe on input changes or cleanup.
  Never block SSR on a Promise that only browser work can settle.

## Make cache bindings synchronous and network-free

- **Compared:** Apollo's React `useFragment` hook and Vue 5 `useFragment`
  composable both normalize entity objects with `cache.identify`, read
  `watchFragment().getCurrentResult()` synchronously, and subscribe only for
  later cache updates.
- **Ended with:** `<const-fragment>` returns the reactive cache result as a
  read-only tag variable. Its parsed fragment uses a getter, while the plain
  `from` identifier stays a direct, serializable input. It reads an available
  server cache without suspending, serializes only the plain snapshot,
  reconstructs the browser watch from client and document getters, and
  unsubscribes on replacement.
- **Rule:** A cache-only binding should render its current snapshot immediately,
  never imply network loading, and scope its reconstructed browser watch to the
  tag lifecycle.

## Reconstruct non-serializable shared-state dependencies

- **Tried:** Server-rendered Marko Run pages passed Jotai atoms and a store, and
  TanStack stores and atoms, directly to their bindings. The instances' methods
  and closures disappeared from resume state, so browser subscriptions had no
  usable dependencies. Starting the whole view after resume worked but discarded
  useful SSR.
- **Tried next:** Wrapping a render-owned store with `store=() => store` still
  captured the instance and made Marko attempt to serialize it.
- **Ended with:** Jotai atom and store inputs, plus TanStack atom and readable
  source inputs, use inline getters that reference statically reconstructable
  definitions, such as module-scoped TypeScript exports or Marko `static`
  values. Store getters may be installed once as render-wide defaults. Marko
  creates those definitions independently in each target.
- **Rule:** Inline getters for non-serializable dependencies, whether passed to
  an initializer or a consumer, must reference statically reconstructable
  values. A render-local store needs a different first-class API; do not hide
  that limitation behind serialization workarounds.

## Separate synchronous and asynchronous atom declarations

- **Tried:** `<let-atom>` and `<const-atom>` each supported both a returned raw
  value and a body that resolved async atom values.
- **Ended with:** `<let-atom>` returns writable synchronous state,
  `<const-atom>` returns read-only synchronous state, and `<await-atom>` owns the
  body that consumes a resolved async value. An internal observer tag shares
  atom reads, subscriptions, and cleanup across all three.
- **Rule:** Keep lifecycle observation shared, but expose separate public tags
  when assignment and asynchronous content require different Marko syntax.

## Hydrate cache state separately from observer views

- **Constraint:** TanStack Query's `select` can make observer data differ from
  the raw value stored in the query cache, and custom key hashing can make
  writing that selected value back by `queryKey` target the wrong cache entry.
- **Ended with:** `<await-query>` serializes its function-free settled observer
  result alongside TanStack's dehydrated state for the exact server query. It
  hydrates that state before creating the browser observer. A browser-only
  initial fetch disables the observer's first mount refetch because that fetch
  has just completed; resumed server queries retain TanStack's stale-on-mount
  behavior.
- **Rule:** When a library distinguishes cached data from its projected view,
  transfer its native dehydrated cache state instead of seeding the cache from
  rendered result data.

## Reconstruct form controllers behind lifecycle-owned facades

- **Tried:** Returning TanStack `FormApi` and `FieldApi` instances directly, or
  creating fields through a `form.fields()` method or eager record.
- **Ended with:** `<const-form>` and `<const-field>` each return a reactive plain
  facade while `<lifecycle>` mounts, updates, and destroys a target-local core
  instance. Fields are declarations so conditional and repeated fields own their
  registration and cleanup. The field facade augments its plain state snapshot
  with a nested `valueChange` handler, making `field.state.value` a writable
  Marko binding for `value:=` and `checked:=` while retaining `handleChange` as
  an escape hatch.
- **Rule:** Do not serialize imperative form controllers or hide field creation
  in a function call. Serialize plain snapshots and resumable actions,
  reconstruct controllers per target, give each field a declarative lifecycle
  boundary, and project controlled values through Marko change handlers.

## Adding a decision

```md
## Short decision

- **Tried:** The rejected approach.
- **Ended with:** The current approach.
- **Rule:** The reusable guidance for future bindings.
```
