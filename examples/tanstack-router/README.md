# TanStack Router without Marko Run

A small file-routed Vite SSR application using
`@marko-bindings/tanstack-router` and `@marko-bindings/tanstack-query`
directly. It deliberately does not use `@marko/run`.

`@marko-bindings/tanstack-router/vite` discovers the critical TypeScript route
modules and lazy `*.component.marko` files in `src/routes`, then writes
`src/routeTree.gen.ts`.

The custom Node server loads the Marko document using `@marko/vite`'s linked
server-entry convention:

```js
const { default: RouterApp } = await vite.ssrLoadModule(
  "./src/router.server-entry.marko",
);
```

The same entry is used by the production SSR environment build:

```ts
rolldownOptions: {
  input: "src/router.server-entry.marko",
}
```

`@marko/vite` resolves this virtual entry to `router.marko` and links the browser
modules needed for resumption. No compatibility resolver is required.

## Run

From the repository root:

```sh
pnpm install
pnpm --filter @marko-bindings/example-tanstack-router dev
```

Then visit <http://localhost:3000>. Try loading `/about`, `/query`, or
`/posts/42` directly, then navigate with the links to verify browser-side
routing and lazy route-component loading. The `/query` route server-renders data from `/api/books`, hydrates its
TanStack Query cache, and includes an invalidation button that refetches from the
same API after resumption.

## Production preview

Build both Vite environments and start the production HTTP server:

```sh
pnpm --filter @marko-bindings/example-tanstack-router build
pnpm --filter @marko-bindings/example-tanstack-router preview
```

The SSR bundle is written to `dist/server`, browser assets are written to
`dist/client`, and the preview listens on <http://localhost:4173>. The preview
server imports the built Marko server entry directly and serves immutable client
assets before falling back to SSR for application URLs.
