# `@marko-bindings/tanstack-router`

TanStack Router bindings for Marko 6.

> Initial implementation in progress. Manual routes are available, and the
> file-route runtime now supports lazily imported `.component.marko` templates.
> Route-tree generation is the next Vite-plugin tracer. See the
> [manual-route decision](docs/adr/0001-manual-routes-and-marko-resumption.md)
> and [file-component decision](docs/adr/0002-file-route-components.md).

A runnable [direct Vite SSR example](../../../examples/tanstack-router/README.md)
demonstrates server entry loading, route-loader hydration, TanStack Query cache
hydration, and browser navigation without Marko Run.
