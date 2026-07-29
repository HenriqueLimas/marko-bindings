# TanStack Query with Marko Run

This example uses `marko-tanstack-query` in one Marko Run application. The page
at `/` server-renders a query whose fetch function calls the application's own
JSON endpoint at `/api/books`.

```sh
pnpm --filter @marko-bindings/example-tanstack-query dev
```

Open <http://localhost:3000> for the query page or
<http://localhost:3000/api/books> for the JSON response.

The application demonstrates the binding's resumable dependency pattern:

- `query-client.marko` creates a request-scoped server `QueryClient` and a
  memoized browser client.
- `books-query.ts` defines the query key, fetch function, and observer options in
  a regular TypeScript module.
- The page installs the client getter once with `<init-query-client>`, turns the
  current request URL into a serializable absolute API URL, and passes only the
  query options getter to `<await-query>`.
- `<await-query>` awaits the API call during server rendering, dehydrates only the
  matching TanStack cache entry, and reconstructs its observer after resumption.
- The refresh button invalidates the same memoized browser client. The settled list
  remains visible during the background request and updates when the local API
  responds.

The endpoint increments `requestNumber` on every call so a refresh makes the
reactive cache update visible without relying on an external service.
