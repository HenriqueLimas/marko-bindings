# Cleanup

Duplication, inconsistencies, refactoring opportunities, and follow-up features. Format and rules: [README.md](README.md).

## marko-tanstack-store: Design a typed action-factory API for create-store

`packages/shared-state/marko-tanstack-store/src/tags/create-store.marko:1` | 2026-07-23 | impact:med | effort:med

The JavaScript `createStore` export supports an actions factory, but `<create-store>` intentionally exposes only the overload that needs no unsafe generic narrowing. Design a tag-native API that preserves `StoreActionsFactory<TState, TActions>` inference without `as never`, duplicated overload shims, or runtime wrappers whose only purpose is satisfying TypeScript. An attribute tag for action definitions or a separate action-store tag may fit Marko better than mirroring the overloaded JavaScript call.
