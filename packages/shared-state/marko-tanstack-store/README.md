# marko-tanstack-store

TanStack Store creation and reactive selectors as native Marko 6 tags.

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

Use `<create-store>` when the store belongs to a Marko tag rather than a JavaScript module:

```marko
<create-store/counter={ count: 0 }/>
<use-selector/count=(state) => state.count store=counter/>

<button onClick() {
  counter.setState((state) => ({ ...state, count: state.count + 1 }));
}>
  ${count}
</button>
```

The returned value is the same typed TanStack `Store` produced by the JavaScript `createStore` API. Use `createStore()` when a JavaScript module owns the store or when an actions factory is needed; use `<create-store>` for a simple tag-local store.

### Creating and using an atom in markup

`<create-atom>` creates a writable atom. `<use-atom>` exposes it as one writable Marko tag variable, using Marko's `value`/`valueChange` binding instead of a `[state, setState]` tuple:

```marko
<create-atom/atom=0/>
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

### `<create-store>`

```marko
<create-store/store=initialState/>
```

| Input   | Type     | Description                                 |
| ------- | -------- | ------------------------------------------- |
| `value` | `TState` | Default input containing the initial state. |

Returns a typed mutable store as a tag variable. The store is recreated if the input changes and is discarded when the owning tag leaves the document. Use the JavaScript `createStore` export for action factories.

### `<create-atom>`

```marko
<create-atom/atom=initialValue options=options/>
```

| Input     | Type             | Description                                        |
| --------- | ---------------- | -------------------------------------------------- |
| `value`   | `T`              | Default input containing the atom's initial value. |
| `options` | `AtomOptions<T>` | Optional TanStack comparison options.              |

Returns a writable `Atom<T>` as a tag variable.

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

```marko
<use-selector/selected=(state) => state.someValue store=store/>
```

| Input     | Type                                                | Description                                          |
| --------- | --------------------------------------------------- | ---------------------------------------------------- |
| `value`   | `(state: TState) => TSelected`                      | Default input containing the selector function.      |
| `store`   | `Readable<TState>`                                  | TanStack store or atom to observe.                   |
| `compare` | `(previous: TSelected, next: TSelected) => boolean` | Optional equality function; defaults to `Object.is`. |

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

TanStack Store and atom instances contain closures and cannot currently cross a Marko server-resume serialization boundary. Use `<create-store>`, `<create-atom>`, `<use-atom>`, and `<use-selector>` with client-rendered state. A future server binding will need an explicit strategy for recreating request-scoped stores in the browser rather than serializing Store instances directly.
