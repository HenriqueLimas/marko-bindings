# Data-fetching bindings

Bindings for query clients, remote data caches, and request lifecycles.

Packages in this group should expose loading, error, and data states as reactive
Marko values, support render-wide client initialization with explicit overrides,
and dispose observers when their owning tags leave the document.

## Packages

- [`marko-apollo-client`](marko-apollo-client) — initialized or explicit Apollo
  Client getters with reactive query, fragment, mutation, and subscription tags.
- [`marko-tanstack-query`](marko-tanstack-query) — resumable TanStack Query
  options with SSR hydration and reactive settled results.
