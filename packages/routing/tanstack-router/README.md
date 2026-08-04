# `@marko-bindings/tanstack-router`

TanStack Router bindings for Marko 6.

> Initial implementation in progress. Manual routes and the first physical
> file-route generator tracer are available. See the
> [manual-route decision](docs/adr/0001-manual-routes-and-marko-resumption.md)
> and [file-component decision](docs/adr/0002-file-route-components.md).

## Vite file routes

Place critical route configuration and Marko UI pieces beside one another:

```text
src/routes/
  __root.ts
  __root.component.marko
  about.ts
  about.component.marko
  about.errorComponent.marko
```

Add the router plugin before `@marko/vite`:

```ts
import marko from "@marko/vite";
import { tanstackRouter } from "@marko-bindings/tanstack-router/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tanstackRouter(), marko()],
});
```

The plugin generates `src/routeTree.gen.ts` and its Marko load manifest,
`src/routeTree.gen.marko`. A component-only Marko route gets a virtual route
configuration automatically. Import the generated tree and pass an inline
getter so each Marko target uses its own route instances:

```marko
import { routeTree } from "./routeTree.gen.js";

<tsr-router/router routeTree=() => routeTree/>
<tsr-router-provider router=router/>
```

A route component renders its nested match as ordinary body content:

```marko
import type { RouteComponentContext } from "@marko-bindings/tanstack-router";

export interface Input extends RouteComponentContext {}

<h1>${input.route.loaderData.title}</h1>
<${input.content}/>
```

A runnable [direct Vite SSR example](../../../examples/tanstack-router/README.md)
demonstrates server entry loading, route-loader hydration, TanStack Query cache
hydration, and browser navigation without Marko Run.
