import type { Plugin } from "vite";

export type TokenMatcher = string | RegExp | { regex: string; flags?: string };

export interface TanStackRouterOptions {
  routesDirectory?: string;
  generatedRouteTree?: string;
  routeFilePrefix?: string;
  routeFileIgnorePrefix?: string;
  routeFileIgnorePattern?: string;
  indexToken?: TokenMatcher;
  routeToken?: TokenMatcher;
  disableLogging?: boolean;
  quoteStyle?: "single" | "double";
  semicolons?: boolean;
}

export function tanstackRouter(options?: TanStackRouterOptions): Plugin;

/** @deprecated Use `tanstackRouter` instead. */
export const TanStackRouterVite: typeof tanstackRouter;

export default tanstackRouter;
