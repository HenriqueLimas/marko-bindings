# ADR 0002: File route component modules and nested content

- **Status:** Accepted
- **Date:** 2026-08-03

## Context

TanStack Router's generator keeps critical route configuration in the route
module and can attach framework components from separately imported files. Vue
supports component pieces such as `posts.component.vue` because a Vue SFC has a
default component export and should not be parsed as a `createFileRoute`
declaration.

Official adapters implement `<Outlet>` with framework component context. The
adapter provides the current route or match ID above a route component, and the
outlet consumes it to locate and render the child match. Marko has no lexical
provider/consumer context. Its `$global` object is render-wide, so using it as a
mutable current-outlet stack would be unsafe during nested, asynchronous, and
resumed rendering.

## Decision

File routes separate critical TypeScript configuration from Marko UI pieces:

```text
src/routes/
  __root.ts
  __root.component.marko
  posts.ts
  posts.component.marko
  posts.errorComponent.marko
  posts.pendingComponent.marko
  posts.notFoundComponent.marko
```

Marko component pieces export their template as `default`, retain the `.marko`
extension in generated imports, and are not parsed or rewritten as JavaScript
route declarations. A Marko `lazyRouteComponent` gives TanStack Router a
`preload()` method and resolves the imported template for the match renderer.

A raw JavaScript dynamic import rendered the correct server HTML, but its route
module registered resumable functions after the main browser entry had already
called Marko's `init()`. The generated tree therefore has a companion
`routeTree.gen.marko` module that imports each component with
`with { load: "render" }`. During SSR, `lazyRouteComponent` renders that
asset-aware template so Marko flushes its load entry before resumption. In the
browser, TanStack preloads and renders the directly imported template so later
route-input updates target the loaded component rather than Marko's temporary
load wrapper.

The match renderer continues to own one local recursive body. It passes the next
match as the route component's standard `input.content` and passes the active
match projection as `input.route`:

```marko
export interface Input extends RouteComponentContext {}

<article>
  <h1>${input.route.loaderData.title}</h1>
  <${input.content}/>
</article>
```

A component that omits `<${input.content}/>` intentionally hides its child
routes. A route without a component renders its child automatically. Error,
pending, and not-found components replace route content and receive their own
boundary-specific inputs instead of nested content.

Generated imperative route trees are constructed independently in each target.
A Marko caller passes an inline route-tree getter to `<tsr-router>` so the route
instances do not cross the server resume boundary.

## Consequences

- Route nesting uses ordinary Marko body composition without mutable globals.
- Component modules can be emitted as independent Vite chunks.
- Critical loaders and route options stay available without loading markup.
- Route components access match state through `input.route` rather than hooks.
- The Marko-owned Vite generator recognizes default-exported `.marko`
  component pieces, emits a TypeScript route tree plus a Marko load manifest,
  and uses TanStack's public physical-route discovery API for critical route
  modules.
