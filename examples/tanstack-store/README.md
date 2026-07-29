# TanStack Store cart with Marko Run

This example uses `@marko-bindings/tanstack-store` to build a small cart in a Marko Run
application. It demonstrates:

- selecting mutable store state with `<const-selected>`;
- invoking store actions from Marko event handlers;
- selecting a readonly store derived from a store and an atom; and
- writing to an atom through `<let-atom>`.

The stores and atom are module-scoped exports from `src/cart-store.ts`, so the
server and browser bundles instantiate them independently. The cart installs
`cartStore` once with `<init-tanstack-store>`; its context-backed selector
annotates the state type because an omitted store cannot contribute inference.
A second initializer replaces the default with `summaryStore` immediately before
the summary binding, and `<let-atom>` receives `memberAtom` directly. This keeps
TanStack's methods and reactive graph
out of serialized resume state while preserving SSR.

```sh
pnpm --filter @marko-bindings/example-tanstack-store dev
```

Open <http://localhost:3000>, then change quantities, remove products, or toggle
the member discount. The server renders the initial cart and the browser resumes
subscriptions and writes against its reconstructed TanStack sources.
