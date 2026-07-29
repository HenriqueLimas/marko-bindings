const storeContextKey = Symbol.for("marko-jotai.store");

export function getStoreContext(global) {
  return global[storeContextKey];
}

export function setStoreContext(global, store) {
  return (global[storeContextKey] = store);
}
