# Cleanup

Duplication, inconsistencies, refactoring opportunities, and follow-up features. Format and rules: [README.md](README.md).

## marko-tanstack-store: Allow use-selector to default to identity selection

`packages/shared-state/marko-tanstack-store/src/tags/use-selector.marko:3` | 2026-07-23 | impact:low | effort:low

Other TanStack adapters allow the selector to be omitted when the whole source value is needed. Make the default `value` input optional so consumers can write `<use-selector/state store=store/>`, while preserving inference for explicit selectors. `<use-atom>` should remain the writable convenience for mutable atoms; identity `<use-selector>` must also support readonly atoms and stores.

## marko-tanstack-store: Add typed readonly and asynchronous creation tags

`packages/shared-state/marko-tanstack-store/src/tags/create-atom.marko:1` | 2026-07-23 | impact:med | effort:med

The creation tags currently cover simple mutable state, but TanStack also exposes getter-based readonly atoms and stores plus `createAsyncAtom`. Add explicit, fully typed Marko APIs for these forms rather than detecting function-valued inputs or using type assertions to force overloaded calls. Consider separate `<create-derived-atom>`, `<create-derived-store>`, and `<create-async-atom>` tags if that keeps each tag's contract unambiguous.

## marko-tanstack-store: Design a typed action-factory API for create-store

`packages/shared-state/marko-tanstack-store/src/tags/create-store.marko:1` | 2026-07-23 | impact:med | effort:med

The JavaScript `createStore` export supports an actions factory, but `<create-store>` intentionally exposes only the overload that needs no unsafe generic narrowing. Design a tag-native API that preserves `StoreActionsFactory<TState, TActions>` inference without `as never`, duplicated overload shims, or runtime wrappers whose only purpose is satisfying TypeScript. An attribute tag for action definitions or a separate action-store tag may fit Marko better than mirroring the overloaded JavaScript call.
