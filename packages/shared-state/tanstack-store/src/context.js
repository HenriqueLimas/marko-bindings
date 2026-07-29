const storeContextKey = Symbol.for("@marko-bindings/tanstack-store.store");

export function getStoreContext(global) {
  return global[storeContextKey];
}

export function setStoreContext(global, store) {
  return (global[storeContextKey] = store);
}
