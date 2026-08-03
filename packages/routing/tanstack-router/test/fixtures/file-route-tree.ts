import {
  createFileRoute,
  createRootRoute,
  lazyRouteComponent,
} from "../../src/index.js";
import RootComponent from "./root.component.marko";

export const rootRoute = createRootRoute({ component: RootComponent });
export const aboutRouteImport = createFileRoute("/about")({});
export const brokenRouteImport = createFileRoute("/broken")({
  loader: () => {
    throw new Error("Broken loader");
  },
});

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

export const routeTree = rootRoute._addFileChildren({
  aboutRoute,
  brokenRoute,
});
