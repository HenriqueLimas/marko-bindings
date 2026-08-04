# @marko-bindings/tanstack-query

## 0.1.0

### Minor Changes

- 1212e82: Add an event-driven `<const-mutation>` tag with lazy `MutationObserver` execution, reactive latest-call state, reset support, initialized-client fallback, and lifecycle cleanup.
- 41e6179: Add the initial TanStack Query binding with a resumable, reactive `<await-query>` tag and the complete `@tanstack/query-core` public API re-exported from the package entrypoint.
- 77bbaaa: Add render-wide client and store initializer tags so consumer bindings can omit repeated dependency getters while retaining explicit per-tag overrides.
