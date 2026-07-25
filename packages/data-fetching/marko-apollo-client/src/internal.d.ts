import type {
  ApolloClient,
  MaybeMasked,
  ObservableQuery,
  OperationVariables,
} from "@apollo/client";

declare global {
  namespace Marko {
    interface Global {
      apolloClient?: ApolloClient;
    }
  }
}

export function getApolloClient(global: Marko.Global): ApolloClient;

export function provideApolloClient(
  global: Marko.Global,
  client: ApolloClient,
): ApolloClient;

export function watchQuery<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(
  client: ApolloClient,
  input: ApolloClient.WatchQueryOptions<TData, TVariables> & {
    content?: Marko.Body<
      [
        ObservableQuery.Result<MaybeMasked<TData>>,
        ObservableQuery<TData, TVariables>,
      ]
    >;
  },
): ObservableQuery<TData, TVariables>;
