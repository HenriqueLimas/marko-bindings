import { QueryClient, setClientContext } from "@marko-bindings/tanstack-query";

import { booksQuery } from "../../books-query.js";

export const GET: MarkoRun.GET = Run.GET((context, next) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  setClientContext(context, client);

  const apiUrl = new URL("/api/books?delay=500", context.url).href;
  void client.prefetchQuery(booksQuery(apiUrl, context.fetch));

  return next();
});
