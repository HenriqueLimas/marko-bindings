import type {
  QueryObserverOptions,
  QueryFunctionContext,
} from "@marko-bindings/tanstack-query";

import type { BooksResponse } from "./books.js";

export const BOOKS_QUERY_KEY = ["books"] as const;

type BooksQueryOptions = QueryObserverOptions<
  BooksResponse,
  Error,
  BooksResponse,
  BooksResponse,
  typeof BOOKS_QUERY_KEY
>;

export function booksQuery(apiUrl: string): BooksQueryOptions {
  return {
    queryKey: BOOKS_QUERY_KEY,
    queryFn: async ({
      signal,
    }: QueryFunctionContext<typeof BOOKS_QUERY_KEY>) => {
      const response = await fetch(apiUrl, {
        headers: { accept: "application/json" },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Books API returned ${response.status}.`);
      }

      return response.json() as Promise<BooksResponse>;
    },
    staleTime: 30_000,
  };
}
