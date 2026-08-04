import {
  createFileRoute,
  createRootRoute,
  lazyRouteComponent,
  notFound,
} from "../../src/index.js";
import RootComponent from "./root.component.marko";
import SlowPendingComponent from "./slow.pendingComponent.marko";

export const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: lazyRouteComponent(
    () => import("./global.notFoundComponent.marko"),
  ),
});
export const aboutRouteImport = createFileRoute("/about")({});
export const brokenRouteImport = createFileRoute("/broken")({
  loader: () => {
    throw new Error("Broken loader");
  },
});
export const missingRouteImport = createFileRoute("/missing")({
  loader: () => {
    throw notFound({ data: "Missing loader data" });
  },
});
let finishSlowLoader: (() => void) | undefined;
export const slowRouteImport = createFileRoute("/slow")({
  loader: () =>
    new Promise<void>((resolve) => {
      finishSlowLoader = resolve;
    }),
  pendingMs: 0,
});
export function resolveSlowLoader() {
  finishSlowLoader?.();
  finishSlowLoader = undefined;
}

const aboutRoute = aboutRouteImport.update({
  id: "/about",
  path: "/about",
  getParentRoute: () => rootRoute,
  component: lazyRouteComponent(() => import("./about.component.marko")),
} as any);
const brokenRoute = brokenRouteImport.update({
  id: "/broken",
  path: "/broken",
  getParentRoute: () => rootRoute,
  errorComponent: lazyRouteComponent(
    () => import("./broken.errorComponent.marko"),
  ),
} as any);
const missingRoute = missingRouteImport.update({
  id: "/missing",
  path: "/missing",
  getParentRoute: () => rootRoute,
  notFoundComponent: lazyRouteComponent(
    () => import("./missing.notFoundComponent.marko"),
  ),
} as any);
const slowRoute = slowRouteImport.update({
  id: "/slow",
  path: "/slow",
  getParentRoute: () => rootRoute,
  component: lazyRouteComponent(() => import("./slow.component.marko")),
  pendingComponent: SlowPendingComponent,
} as any);

export const routeTree = rootRoute._addFileChildren({
  aboutRoute,
  brokenRoute,
  missingRoute,
  slowRoute,
});
