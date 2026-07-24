# Unclear Code & Docs

Behavior and design decisions that need clarification before implementation. Format and rules: [README.md](README.md).

## marko-tanstack-store: Decide whether creation inputs initialize or replace state

`packages/shared-state/marko-tanstack-store/src/tags/create-store.marko:7` | 2026-07-23 | impact:med | effort:med

`<create-store>` and `<create-atom>` currently derive their instances from reactive inputs, so changing an input creates a replacement instance. React's `useCreateStore` and `useCreateAtom` instead use their arguments only for initialization and keep one instance for the component lifetime. Decide and document the Marko ownership contract before expanding the creation tags; if instances should be stable, implement that with a native Marko lifecycle model rather than relying on non-reactive or module-level caches.

## marko-tanstack-store: Document which framework-adapter APIs should remain omitted

`packages/shared-state/marko-tanstack-store/README.md:1` | 2026-07-23 | impact:low | effort:low

TanStack adapters expose a deprecated `useStore`, an experimental `_useStore`, and React-specific context helpers. These should not be copied automatically: `useStore` is superseded by `useSelector`, `_useStore` is not stable, and Marko should prefer tag ownership and composition over React context factories. Add an explicit non-goals or framework-parity section so future parity work does not introduce deprecated or framework-shaped APIs without a Marko-specific use case.
