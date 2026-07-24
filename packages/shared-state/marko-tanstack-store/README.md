# marko-tanstack-store

TanStack Store and atom bindings for Marko 6.

The package owns its `@tanstack/store` dependency and re-exports its public API, so applications only need to install `marko-tanstack-store`.

## Install

```sh
pnpm add marko-tanstack-store
```

`marko` remains a peer dependency.

## Usage

Import `createStore` from this package and select the state a template needs with `<use-selector>`:

```marko
import { createStore } from "marko-tanstack-store";

static const counter = createStore(
  { count: 0, label: "Count" },
  ({ setState }) => ({
    increment: () =>
      setState((state) => ({ ...state, count: state.count + 1 })),
  }),
);

<use-selector/count=(state) => state.count store=counter/>

<button onClick() {
  counter.actions.increment();
}>
  ${count}
</button>
```

The expression assigned to `<use-selector>` is its default `value` input. The `/count` portion names the returned reactive tag variable.

### Creating a store in markup

Call `createStore` from a Marko `<const>` when the store belongs to a tag rather than a JavaScript module:

```marko
import { createStore } from "marko-tanstack-store";

<const/counter=createStore({ count: 0 })>
<use-selector/count=(state) => state.count store=counter/>

<button onClick() {
  counter.setState((state) => ({ ...state, count: state.count + 1 }));
}>
  ${count}
</button>
```

Calling the JavaScript API directly preserves all of TanStack's overloads and inferred return types for mutable, action, and readonly derived stores.

### Creating and using an atom in markup

Call `createAtom` from a Marko `<const>` and use `<use-atom>` to expose it as one writable tag variable. `<use-atom>` uses Marko's `value`/`valueChange` binding instead of a `[state, setState]` tuple:

```marko
import { createAtom } from "marko-tanstack-store";

<const/atom=createAtom(0)>
<use-atom/count=atom/>

<button onClick() {
  count += 5;
}>
  ${count}
</button>
```

Assigning to `count` calls `atom.set()`; updates made directly through the atom also flow back into `count`. Use `<use-selector/value=(state) => state store=computedAtom/>` to observe readonly or computed atoms.

### Selecting values

Selectors can return any value:

```marko
<use-selector/incomplete=(state) => state.todos.filter((todo) => !todo.complete)
  store=todoStore
/>

<for|todo| of=incomplete>
  <p>${todo.title}</p>
</for>
```

## API

### `<use-atom>`

```marko
<use-atom/value=atom/>
```

| Input     | Type                                | Description                                          |
| --------- | ----------------------------------- | ---------------------------------------------------- |
| `value`   | `Atom<T>`                           | Default input containing the atom to observe.        |
| `compare` | `(previous: T, next: T) => boolean` | Optional equality function; defaults to `Object.is`. |

Returns the atom's current `T` as a reactive, writable tag variable. Custom comparison controls which atom values are published without disabling writes. Assignments are forwarded to `atom.set()` through Marko's `valueChange` convention:

```marko
<use-atom/count=atom/>
<button onClick() {
  count += 5;
}>
  Add five
</button>
```

Use `<use-selector>` for readonly and computed atoms.

### `<use-selector>`

Select part of a source:

```marko
<use-selector/selected=(state) => state.someValue store=store/>
```

Omit the selector to observe the complete source value:

```marko
<use-selector/state store=store/>
```

| Input     | Type                                                | Description                                               |
| --------- | --------------------------------------------------- | --------------------------------------------------------- |
| `value`   | `(state: TState) => TSelected`                      | Optional default input; omitted means identity selection. |
| `store`   | `Readable<TState>`                                  | TanStack store or atom to observe.                        |
| `compare` | `(previous: TSelected, next: TSelected) => boolean` | Optional equality function; defaults to `Object.is`.      |

Returns `TSelected` as a reactive, read-only tag variable. The tag:

1. selects the initial value from `store.get()`;
2. subscribes after mounting;
3. reselects whenever the store emits;
4. publishes only when `compare(previous, next)` returns `false`;
5. moves the subscription when `store`, the selector, or comparison changes; and
6. unsubscribes when the tag leaves the document.

Use the re-exported `shallow` comparator for object or array selections:

```marko
import { shallow } from "marko-tanstack-store";

<use-selector/user=(state) => state.user store=store compare=shallow/>
```

### JavaScript exports

The package re-exports the complete `@tanstack/store` entrypoint, including:

```js
import {
  batch,
  createAsyncAtom,
  createAtom,
  createStore,
  flush,
} from "marko-tanstack-store";
```

No separate `@tanstack/store` installation is required.

## Server rendering

TanStack Store and atom instances contain closures and cannot currently cross a Marko server-resume serialization boundary. Use `createStore`, `createAtom`, `<use-atom>`, and `<use-selector>` with client-rendered state. A future server binding will need an explicit strategy for recreating request-scoped stores in the browser rather than serializing Store instances directly.
