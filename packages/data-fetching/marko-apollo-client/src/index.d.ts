import type { ApolloClient } from "@apollo/client";

declare global {
  namespace Marko {
    interface Global {
      apolloClient?: ApolloClient;
    }
  }
}

export * from "@apollo/client";
