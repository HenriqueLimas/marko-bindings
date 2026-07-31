---
"@marko-bindings/tanstack-query": minor
---

Add the initial TanStack Query binding with resumable `<await-query>` and `<const-query>` tags, request-context client helpers, and the complete `@tanstack/query-core` public API re-exported from the package entrypoint. `<const-query>` streams pending server query Promises through TanStack dehydration and publishes every observer event without an async content boundary.
