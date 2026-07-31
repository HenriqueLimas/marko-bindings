import { createBrowserHistory, createMemoryHistory } from "@tanstack/history";
import {
  BaseRootRoute,
  BaseRoute,
  RouterCore,
  createNonReactiveMutableStore,
  createNonReactiveReadonlyStore,
} from "@tanstack/router-core";
import { isServer } from "@tanstack/router-core/isServer";
import { batch, createAtom } from "@tanstack/store";

export class MarkoRootRoute extends BaseRootRoute {}
export class MarkoRoute extends BaseRoute {}

const facadeValues = new WeakMap();
const defaultRouterKey = Symbol.for("@marko-bindings/tanstack-router/default");

export function createFacadeHandle() {
  return {};
}

export function initializeDefaultRouter(global, router) {
  global[defaultRouterKey] = router;
  return router;
}

export function getDefaultRouter(global) {
  const router = global[defaultRouterKey];
  if (!router) {
    throw new Error(
      "<router-link> must be rendered by <router-provider> or receive a router input.",
    );
  }
  return router;
}

export function getLinkAnchorProps(input, href, onClick) {
  const {
    router: _router,
    to: _to,
    content: _content,
    href: _href,
    onClick: _onClick,
    ...anchor
  } = input;
  return { ...anchor, href, onClick };
}

export function getFacadeValue(handle, create) {
  let value = facadeValues.get(handle);
  if (value === undefined && create) {
    value = create();
    facadeValues.set(handle, value);
  }
  if (value === undefined) {
    throw new Error("TanStack Router facade was read before reconstruction.");
  }
  return value;
}

const getStoreConfig = (options) => {
  if (isServer ?? options.isServer) {
    return {
      createMutableStore: createNonReactiveMutableStore,
      createReadonlyStore: createNonReactiveReadonlyStore,
      batch: (callback) => callback(),
    };
  }

  return {
    createMutableStore: createAtom,
    createReadonlyStore: createAtom,
    batch,
  };
};

export function createMarkoRootRoute(component) {
  return new MarkoRootRoute({ component });
}

export function createMarkoRoute(input) {
  return new MarkoRoute({
    path: input.path,
    getParentRoute: () => input.parent,
    component: input.component,
    loader: input.loader,
  });
}

export function createMarkoRouteTree(root, children) {
  return root.addChildren(children);
}

export function createMarkoRouter(routeTree, initialUrl) {
  const server = isServer ?? typeof document === "undefined";
  const url =
    initialUrl instanceof URL
      ? initialUrl
      : new URL(initialUrl || "/", "http://localhost");
  const history = server
    ? createMemoryHistory({
        initialEntries: [`${url.pathname}${url.search}${url.hash}`],
      })
    : createBrowserHistory();

  return new RouterCore(
    {
      routeTree,
      history,
      isServer: server,
    },
    getStoreConfig,
  );
}

const initialLoads = new WeakMap();

export function loadRouter(router) {
  let load = initialLoads.get(router);
  if (!load) {
    load = router.load();
    initialLoads.set(router, load);
  }
  return load;
}

export async function prepareRouter(router) {
  const server = isServer ?? typeof document === "undefined";
  if (!server) {
    if (window.$_TSR) {
      const { hydrate } = await import("@tanstack/router-core/ssr/client");
      await hydrate(router);
    } else {
      await loadRouter(router);
    }
    return {};
  }

  const { attachRouterServerSsrUtils } =
    await import("@tanstack/router-core/ssr/server");
  attachRouterServerSsrUtils({ router, manifest: undefined });
  await loadRouter(router);
  await router.serverSsr.dehydrate();

  if (!router.serverSsr.isSerializationFinished()) {
    await new Promise((resolve) => {
      router.serverSsr.onSerializationFinished(resolve);
    });
  }

  return {
    script: router.serverSsr.takeBufferedScripts()?.children,
  };
}

export function getMatchIds(router, _revision) {
  return router.stores.matchesId.get();
}

export function getRenderedRoute(match) {
  return {
    id: match.routeId,
    params: match.params,
    search: match.search,
    loaderData: match.loaderData,
    context: match.context,
    status: match.status,
  };
}

export function getMatchRenderData(router, matchId) {
  const match = router.stores.matchStores.get(matchId)?.get();
  if (!match) {
    throw new Error(`TanStack Router match "${matchId}" was not found.`);
  }

  return {
    component: router.routesById[match.routeId]?.options.component,
    route: getRenderedRoute(match),
  };
}
