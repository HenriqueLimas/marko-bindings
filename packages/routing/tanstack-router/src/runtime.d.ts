import type { Readable } from "@tanstack/store";
import {
  BaseRootRoute,
  BaseRoute,
  type AnyContext,
  type AnyRoute,
  type AnyRouteMatch,
  type CreateFileRoute,
  type ErrorComponentProps,
  type FileRoutesByPath,
  type MakeRouteMatchFromRoute,
  type Register,
  type RootRouteOptions,
  type RouterCore,
} from "@tanstack/router-core";

export type RenderedRoute<TRoute extends AnyRoute = AnyRoute> = Readonly<
  Pick<
    MakeRouteMatchFromRoute<TRoute>,
    "params" | "search" | "loaderData" | "context" | "status"
  > & { id: string }
>;

export interface RouteComponentContext<TRoute extends AnyRoute = AnyRoute> {
  content: Marko.Body;
  route: RenderedRoute<TRoute>;
}

export interface RouteFacade<TRoute extends AnyRoute = AnyRoute> {
  api: () => TRoute;
}

export interface RouteTreeFacade<TRoute extends AnyRoute = AnyRoute> {
  api: () => TRoute;
}

export interface RouterFacade<
  TRouter extends RouterCore<any, any, any, any, any> = RouterCore<
    any,
    any,
    any,
    any,
    any
  >,
> {
  api: () => TRouter;
}

export type RouteTemplate<TInput> =
  Marko.Template<TInput> | Marko.Body<[input: TInput]>;

export type RouteComponent<TRoute extends AnyRoute = AnyRoute> = RouteTemplate<
  RouteComponentContext<TRoute>
>;
export type ErrorRouteComponent = RouteTemplate<ErrorComponentProps>;
export type AnyRouteComponent = RouteComponent | ErrorRouteComponent;

export interface LazyRouteComponent<
  TComponent extends AnyRouteComponent = AnyRouteComponent,
> {
  preload: () => Promise<void>;
}

export type RouteComponentOption<TRoute extends AnyRoute = AnyRoute> =
  RouteComponent<TRoute> | LazyRouteComponent<RouteComponent<TRoute>>;
export type ErrorRouteComponentOption =
  ErrorRouteComponent | LazyRouteComponent<ErrorRouteComponent>;

declare module "@tanstack/router-core" {
  interface RouterReadableStore<TValue> extends Readable<TValue> {}

  interface UpdatableRouteOptionsExtensions {
    component?: RouteComponentOption;
    errorComponent?: ErrorRouteComponentOption;
  }
}

export class MarkoRootRoute extends BaseRootRoute {}
export class MarkoRoute extends BaseRoute {}

export function initializeDefaultRouter<T extends RouterFacade>(
  global: object,
  router: T,
): T;
export function getDefaultRouter(global: object): RouterFacade;
export function getLinkAnchorProps(
  input: Marko.HTML.A & {
    router?: RouterFacade;
    to: string;
    content: Marko.Body;
  },
  href: string,
  onClick: (event: PointerEvent, target: HTMLAnchorElement) => void,
): Marko.HTML.A;
export function createFacadeHandle(): object;
export function getRouteTreeInput(
  routeTree: RouteTreeFacade | (() => AnyRoute),
): AnyRoute;
export function getFacadeValue<T>(handle: object, create?: () => T): T;
export function getRouteComponentInput(
  component:
    Marko.AttrTag<{ content: RouteComponent }> | (() => RouteComponentOption),
): RouteComponentOption;
export function lazyRouteComponent<
  TModule extends Record<string, unknown>,
  TKey extends keyof TModule = "default",
>(
  importer: () => Promise<TModule>,
  exportName?: TKey,
): LazyRouteComponent<Extract<TModule[TKey], AnyRouteComponent>>;
export function resolveRouteComponent(
  component?: AnyRouteComponent | LazyRouteComponent,
): AnyRouteComponent | undefined;

type FileRouteInfo<TFilePath extends string> =
  TFilePath extends keyof FileRoutesByPath
    ? FileRoutesByPath[TFilePath]
    : {
        parentRoute: AnyRoute;
        id: string;
        path: string;
        fullPath: string;
      };

export function createRootRoute<
  TRegister = Register,
  TSearchValidator = undefined,
  TRouterContext = {},
  TRouteContextFn = AnyContext,
  TBeforeLoadFn = AnyContext,
  TLoaderDeps extends Record<string, any> = {},
  TLoaderFn = undefined,
  TSSR = unknown,
  const TServerMiddlewares = unknown,
  THandlers = undefined,
>(
  options?: RootRouteOptions<
    TRegister,
    TSearchValidator,
    TRouterContext,
    TRouteContextFn,
    TBeforeLoadFn,
    TLoaderDeps,
    TLoaderFn,
    TSSR,
    TServerMiddlewares,
    THandlers
  >,
): BaseRootRoute<
  TRegister,
  TSearchValidator,
  TRouterContext,
  TRouteContextFn,
  TBeforeLoadFn,
  TLoaderDeps,
  TLoaderFn,
  unknown,
  unknown,
  TSSR,
  TServerMiddlewares,
  THandlers
>;
export function createFileRoute<TFilePath extends string>(
  path: TFilePath,
): CreateFileRoute<
  TFilePath,
  FileRouteInfo<TFilePath>["parentRoute"],
  FileRouteInfo<TFilePath>["id"],
  FileRouteInfo<TFilePath>["path"],
  FileRouteInfo<TFilePath>["fullPath"]
>;

export function createMarkoRootRoute(
  component?: RouteComponentOption,
): MarkoRootRoute;
export function createMarkoRoute(input: {
  parent: AnyRoute;
  path: string;
  component?: RouteComponentOption;
  loader?: (context: any) => any;
}): MarkoRoute;
export function createMarkoRouteTree<
  TRoot extends AnyRoute,
  TChildren extends readonly AnyRoute[],
>(root: TRoot, children: TChildren): TRoot;
export function createMarkoRouter(
  routeTree: AnyRoute,
  initialUrl?: URL | string,
): RouterCore<any, any, any, any, any>;
export function loadRouter(
  router: RouterCore<any, any, any, any, any>,
): Promise<void>;
export function prepareRouter(
  router: RouterCore<any, any, any, any, any>,
): Promise<{ script?: string }>;
export function getMatchIds(
  router: RouterCore<any, any, any, any, any>,
  revision: number,
): string[];
export function getRenderedRoute(match: AnyRouteMatch): RenderedRoute;
export function getMatchRenderData(
  router: RouterCore<any, any, any, any, any>,
  matchId: string,
  content: Marko.Body,
):
  | {
      kind: "component";
      component?: RouteComponent;
      input: RouteComponentContext;
    }
  | {
      kind: "error";
      component?: ErrorRouteComponent;
      error: unknown;
    };
