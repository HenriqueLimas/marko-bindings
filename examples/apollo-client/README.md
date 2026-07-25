# Apollo Client with Marko Run

This example uses the `marko-apollo-client` binding in a Marko Run application.
The page at `/` queries an Apollo Server exposed by the same application at
`/gql`.

```sh
pnpm --filter @marko-bindings/example-apollo-client dev
```

Open <http://localhost:3000> for the Marko page or
<http://localhost:3000/gql> for Apollo Sandbox.

The browser creates and owns the Apollo Client, then passes it directly to
`<use-query>`. The GraphQL endpoint is a Marko Run `+handler.ts` that adapts its
web-standard request and response objects to Apollo Server.
