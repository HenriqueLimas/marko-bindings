import type { QueryClient } from "@tanstack/query-core";

export * from "@tanstack/query-core";

export function getClientContext(global: unknown): QueryClient | undefined;
export function setClientContext(
  global: unknown,
  client: QueryClient | undefined,
): QueryClient | undefined;
