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
const lazyRouteComponentResolve = Symbol(
  "@marko-bindings/tanstack-router/lazy-route-component-resolve",
);
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
      "<tsr-link> must be rendered by <tsr-router-provider> or receive a router input.",
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

export function getRouteTreeInput(routeTree) {
  return typeof routeTree === "function" ? routeTree() : routeTree.api();
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

export function getRouteComponentInput(component) {
  return component && "content" in component ? component.content : component();
}

export function lazyRouteComponent(
  importer,
  exportName = "default",
  serverComponent,
) {
  let component;
  let loadPromise;

  const preload = () => {
    if (!loadPromise && !component) {
      loadPromise = importer().then((module) => {
        component = module[exportName];
        if (!component) {
          throw new Error(
            `The lazy route module does not export "${String(exportName)}".`,
          );
        }
      });
    }

    return loadPromise ?? Promise.resolve();
  };

  return {
    preload,
    [lazyRouteComponentResolve]() {
      if ((isServer ?? typeof document === "undefined") && serverComponent) {
        return serverComponent;
      }
      if (!component) {
        throw new Error(
          "A lazy Marko route component was rendered before it was preloaded.",
        );
      }
      return component;
    },
  };
}

export function resolveRouteComponent(component) {
  return component?.[lazyRouteComponentResolve]?.() ?? component;
}

export function createRootRoute(options) {
  return new MarkoRootRoute(options);
}

export function createFileRoute(_path) {
  return (options) => {
    const route = new MarkoRoute(options);
    route.isRoot = false;
    return route;
  };
}

export function createMarkoRootRoute(component) {
  return createRootRoute({ component });
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

function mergeResponseHeaders(...sources) {
  const result = new Headers();
  for (const source of sources) {
    if (!source) continue;
    const headers = source instanceof Headers ? source : new Headers(source);
    for (const [name, value] of headers) {
      if (name === "set-cookie") {
        const cookies = headers.getSetCookie?.() ?? [value];
        for (const cookie of cookies) result.append(name, cookie);
      } else {
        result.set(name, value);
      }
    }
  }
  return result;
}

function getRouterResponse(router) {
  const redirect = router.stores.redirect.get();
  const headers = mergeResponseHeaders(
    { "content-type": "text/html; charset=utf-8" },
    ...router.stores.matches.get().map((match) => match.headers),
    redirect?.headers,
  );
  return {
    statusCode: redirect?.status ?? router.stores.statusCode.get(),
    headers: [...headers.entries()],
    redirect: Boolean(redirect),
  };
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
    response: getRouterResponse(router),
  };
}

export function getMatchIds(router, _revision) {
  return router.stores.matchesId.get();
}

export function getMatchState(router, revision) {
  return {
    matchIds: getMatchIds(router.api(), revision),
    routerHandle: router.handle,
    revision,
  };
}

export function getRouterForHandle(handle) {
  return getFacadeValue(handle);
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

function getNotFoundComponentOption(router, route) {
  return (
    route?.options.notFoundComponent ??
    (route?.isRoot
      ? router.options.notFoundRoute?.options.component
      : undefined) ??
    router.options.defaultNotFoundComponent
  );
}

function getMatchComponentOption(router, match) {
  const route = router.routesById[match.routeId];
  switch (match.status) {
    case "error":
      return (
        route?.options.errorComponent ?? router.options.defaultErrorComponent
      );
    case "notFound":
      return getNotFoundComponentOption(router, route);
    case "pending":
      return (
        route?.options.pendingComponent ??
        router.options.defaultPendingComponent
      );
    default:
      return route?.options.component ?? router.options.defaultComponent;
  }
}

export function getMatchComponent(router, matchId) {
  const match = router.stores.matchStores.get(matchId)?.get();
  if (!match) {
    throw new Error(`TanStack Router match "${matchId}" was not found.`);
  }
  return resolveRouteComponent(getMatchComponentOption(router, match));
}

export function getMatchRenderData(router, matchId, content, _revision) {
  const match = router.stores.matchStores.get(matchId)?.get();
  if (!match) {
    throw new Error(`TanStack Router match "${matchId}" was not found.`);
  }

  const hasComponent = Boolean(getMatchComponentOption(router, match));
  if (match.status === "error") {
    return { kind: "error", hasComponent, error: match.error };
  }
  if (match.status === "notFound") {
    return {
      kind: "notFound",
      hasComponent,
      input: {
        ...(match.error && typeof match.error === "object" ? match.error : {}),
        isNotFound: true,
        routeId: match.routeId,
      },
    };
  }
  if (match.status === "pending") {
    return { kind: "pending", hasComponent, input: {} };
  }

  return {
    kind: "component",
    hasComponent,
    input: {
      content,
      route: getRenderedRoute(match),
    },
  };
}

export function getGlobalNotFoundRenderData(router, matchId, _revision) {
  const match = router.stores.matchStores.get(matchId)?.get();
  if (!match?.globalNotFound) return { active: false };

  const route = router.routesById[match.routeId];
  return {
    active: true,
    hasComponent: Boolean(getNotFoundComponentOption(router, route)),
    component: resolveRouteComponent(getNotFoundComponentOption(router, route)),
    input: {
      isNotFound: true,
      routeId: match.routeId,
    },
  };
}
