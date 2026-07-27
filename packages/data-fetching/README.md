# Data-fetching bindings

Bindings for query clients, remote data caches, and request lifecycles.

Packages in this group should expose loading, error, and data states as reactive
Marko values, keep client ownership explicit, and dispose observers when their
owning tags leave the document.

## Packages

- [`marko-apollo-client`](marko-apollo-client) — Apollo Client queries with a
  render-scoped provider and reactive query results.
