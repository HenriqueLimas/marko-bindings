# ADR 0001: Manual routes and Marko-native resumption

- **Status:** Accepted
- **Date:** 2026-07-31

## Context

TanStack Router exposes a framework-neutral core but relies on each framework
adapter to construct routes and routers, render active matches, place child
matches at outlets, subscribe to router stores, and coordinate SSR hydration.
Its official adapters use imperative `Route` and `Router` instances that cannot
cross Marko's server-resume boundary with their prototypes and functions intact.

Marko route markup is a compiled `Marko.Body`, not a React-style node. Marko
also has no lexically scoped context API, and `$global` is render-wide rather
than route-scoped. TanStack loader data belongs to individual active matches,
while the initial request URL belongs to the whole render.

## Decision

### Namespace the tag family

All public tags use the `ts-` prefix so their ownership is clear and generic
names do not collide with tags from Marko or other bindings. Declaration tags
use nouns rather than implementation verbs: `<ts-route>` instead of
`<create-route>`, for example.

### Start with manually declared routes

The first package version will not integrate TanStack's route-generator or Vite
plugin. It will expose manual declarations:

```marko
<ts-root-route/rootRoute>...</ts-root-route>
<ts-route/aboutRoute parent=rootRoute path="/about">...</ts-route>
<ts-route-tree/routeTree root=rootRoute children=[aboutRoute]/>
<ts-router/router routeTree=routeTree/>
<ts-router-provider router=router/>
```

The Vite plugin's file discovery, generated route tree, automatic code splitting,
and route HMR are deferred.

### Use direct parent route inputs

`<ts-route>` accepts `parent=rootRoute`. On each target it constructs the
callback TanStack requires internally:

```ts
getParentRoute: () => parent;
```

Application code does not pass `getParentRoute`. This keeps the public API
Marko-native and ensures the callback closes over the target-local parent.

### Reconstruct imperative instances per target

Routes, route trees, routers, histories, stores, callbacks, and component bodies
are not serialized as imperative objects. Declaration tags return plain facades
whose `api()` actions capture only serializable handles and reconstruct the
complete target-local graph lazily on first access. A private `WeakMap` keeps the
imperative instances outside Marko's resume state. Only plain hydration data
crosses the server/browser boundary.

The server router uses memory history initialized from an explicit `url` or the
render-wide `$global.url`. The browser router uses browser history. The
`<ts-router-provider>` receives `router`, renders matches, hydrates state, owns
history/store subscriptions, and cleans them up.

Use TanStack's supported SSR hydration transport initially. Replacing its whole
transport with Marko serialization requires a public transport-neutral
`dehydrateRouter(router)` / `hydrateRouter(router, state)` seam; do not copy
private TanStack hydration logic.

### Store route markup as target-local `Marko.Body` values

`<@component>` supplies `input.component.content`. The reconstructed TanStack
route stores that body in `route.options.component`. A Marko body may be held in
an object, `Map`, or `WeakMap`, but route options match TanStack's adapter model
and avoid a second registry.

A body is rendered only through a dynamic Marko tag. It is never invoked as a
regular JavaScript function and is never included in the dehydrated router
payload.

### Pass nested matches as body content with a rendered route facade

The component body receives one context object. Its standard Marko `content`
body is the nested route:

```marko
<@component|{ content, route }|>
  <h1>${route.loaderData.title}</h1>
  <${content}/>
</@component>
```

`route` is an immutable, read-only projection of the active match with direct
Marko-style properties such as `params`, `search`, `loaderData`, `context`, and
`status`. It is reassigned when the match store publishes; the static TanStack
route definition is not mutated with active state. Hook-style names such as
`useParams` are not exposed.

The internal match renderer uses one local recursive body for the ordered active
matches. Each invocation creates a body bound to the next match index and passes
it as the stored component's `content`. Keeping the recursion in one tag avoids
a browser module cycle between separate match and outlet tags. A route that
omits its content still matches and loads its child but does not display it.

### Keep loader data route-local

TanStack loader data is not written to `$global.data`. Nested matches own
separate loader results, client navigation changes them, and merging them into a
render-wide object would introduce collisions and weak route-specific typing.
`$global.url` may provide the initial server URL because it has one unambiguous
value for the render.

### Require reconstructable callback inputs

Callbacks that must run in both targets use inline wrappers that reference
statically reconstructable definitions:

```marko
loader=({ params }) => loadPost(params.postId)
```

Passing an imported function directly through a custom-tag input may classify it
as server-only and resume it as `undefined`.

## Initial scope

The first tracer covers manual root and child routes, route-tree/router creation,
server rendering at a request URL, provider/match/outlet rendering, one
progressively enhanced router link, browser resumption, and client navigation.
A loader hydration tracer must prove that server-loaded data is not needlessly
fetched again during normal resumption.

Lazy routes, generated file routes, pending/error/not-found bodies, head and
script management, scroll restoration, blockers, and devtools are deferred.

## Consequences

- Marko markup remains explicit and route-local.
- SSR retains useful HTML while browser navigation uses fresh target-local
  imperative instances.
- Route type inference must be preserved through generic tag variables and
  verified with `mtc`.
- The adapter owns substantial match rendering and lifecycle behavior rather
  than wrapping another framework adapter.
- Supporting TanStack's full SSR streaming and hydration semantics remains the
  largest implementation risk.
