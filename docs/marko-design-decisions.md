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

## Return reactive values instead of rendering content

- **Tried:** Query tags accepted content while also exposing query state.
- **Ended with:** `<use-query/result .../>` returns its reactive result through
  `<return>` and renders no content.
- **Rule:** A `use-*` tag should return a value. Accept content only when the tag
  owns rendering behavior, such as an `<await>`-style boundary.

## Keep non-serializable clients outside server resume state

- **Constraint:** `ApolloClient` and `ObservableQuery` are class instances and
  cannot cross Marko's server-resume serialization boundary.
- **Tried:** Creating an `ApolloClient` in a template `<const>`. Server rendering
  worked, but the instance and its constructor were absent from the resumed
  browser bundle.
- **Ended with:** Server data is loaded as serializable route data. Each runtime
  creates its own client outside Marko state (for example, as a module export).
  A browser lifecycle exposes that instance to reactive template state after
  mount, then the application passes it explicitly to queries. Consumer tags
  require the `client` input, accept `undefined` during initialization, stay
  pending without it, and log an error until a client is available.
- **Rule:** Do not put library instances in serializable Marko state. Serialize
  plain data and recreate instances at the appropriate runtime boundary.

## Scope cleanup to what the tag owns

- **Ended with:** `<use-query>` unsubscribes and stops its `ObservableQuery` when
  its inputs change or the tag leaves the document. Its script captures that
  query for cleanup instead of rereading a reactive binding that may have
  changed. It does not stop the shared `ApolloClient` supplied by the
  application.
- **Rule:** A binding cleans up subscriptions and instances it creates, but not
  dependencies passed in by its caller. Cleanup closures must capture the
  resource owned by their specific reactive script run.

## Adding a decision

```md
## Short decision

- **Tried:** The rejected approach.
- **Ended with:** The current approach.
- **Rule:** The reusable guidance for future bindings.
```
