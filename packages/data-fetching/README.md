# Data-fetching bindings

Bindings for query clients, remote data caches, and request lifecycles.

Packages in this group should expose loading, error, and data states as reactive
Marko values, support render-wide client initialization with explicit overrides,
and dispose observers when their owning tags leave the document.

## Packages

- [`@marko-bindings/apollo-client`](apollo-client) — initialized or explicit Apollo
  Client getters with reactive query, fragment, mutation, and subscription tags.
- [`@marko-bindings/tanstack-query`](tanstack-query) — resumable TanStack query
  options with SSR hydration plus event-driven mutations and reactive results.
