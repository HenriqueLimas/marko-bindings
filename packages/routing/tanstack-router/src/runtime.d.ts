import type { Readable } from "@tanstack/store";
import {
  BaseRootRoute,
  BaseRoute,
  type AnyRoute,
  type AnyRouteMatch,
  type MakeRouteMatchFromRoute,
  type RouterCore,
} from "@tanstack/router-core";

export type RenderedRoute<TRoute extends AnyRoute = AnyRoute> = Readonly<
  Pick<
    MakeRouteMatchFromRoute<TRoute>,
    "params" | "search" | "loaderData" | "context" | "status"
  > & { id: string }
>;

export interface RouteComponentContext<TRoute extends AnyRoute = AnyRoute> {
  outlet: Marko.Body;
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

export type RouteComponent<TRoute extends AnyRoute = AnyRoute> = Marko.Body<
  [context: RouteComponentContext<TRoute>]
>;

declare module "@tanstack/router-core" {
  interface RouterReadableStore<TValue> extends Readable<TValue> {}

  interface UpdatableRouteOptionsExtensions {
    component?: RouteComponent;
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
export function getFacadeValue<T>(handle: object, create?: () => T): T;

export function createMarkoRootRoute(
  component?: RouteComponent,
): MarkoRootRoute;
export function createMarkoRoute(input: {
  parent: AnyRoute;
  path: string;
  component?: RouteComponent;
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
): { component?: RouteComponent; route: RenderedRoute };
