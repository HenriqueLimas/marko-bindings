export function getApolloClient(global) {
  const client = global.apolloClient;

  if (!client) {
    throw new Error(
      "No Apollo Client was found on $global. Render <apollo-provider client=...> before <use-query>.",
    );
  }

  return client;
}

export function provideApolloClient(global, client) {
  global.apolloClient = client;
  return client;
}

export function watchQuery(client, input) {
  const { content, ...options } = input;
  return client.watchQuery(options);
}
