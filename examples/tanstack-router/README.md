# TanStack Router without Marko Run

A small Vite SSR application using `@marko-bindings/tanstack-router` and
`@marko-bindings/tanstack-query` directly. It deliberately does not use
`@marko/run`.

The custom Node server loads the Marko document as Vite's linked-mode server
entry:

```js
const { default: RouterApp } = await vite.ssrLoadModule(
  "./src/router.marko?marko-server-entry",
);
```

The `?marko-server-entry` query is important: it identifies the template as the
linked-mode entry that must inject browser modules for resumption. The installed
`@marko/vite` version represents that entry internally as
`router.server-entry.marko`, so `vite.config.ts` contains a small resolver plugin
that maps the explicit query protocol to that virtual entry. The application
server only deals with the stable query form.

## Run

From the repository root:

```sh
pnpm install
pnpm --filter @marko-bindings/example-tanstack-router dev
```

Then visit <http://localhost:3000>. Try loading `/about`, `/query`, or
`/posts/42` directly, then navigate with the links to verify browser-side
routing. The `/query` route server-renders data from `/api/books`, hydrates its
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
