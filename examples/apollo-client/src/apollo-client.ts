import { ApolloClient, HttpLink, InMemoryCache } from "marko-apollo-client";

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({ uri: "/gql" }),
});
