const clientContextKey = Symbol.for("@marko-bindings/tanstack-query.client");

export function getClientContext(global) {
  return global[clientContextKey];
}

export function setClientContext(global, client) {
  return (global[clientContextKey] = client);
}
