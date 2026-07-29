# marko-tanstack-store

TanStack Store and atom bindings for Marko 6.

The package owns its `@tanstack/store` dependency and re-exports its public API, so applications only need to install `marko-tanstack-store`.

## Install

```sh
pnpm add marko-tanstack-store
```

`marko` remains a peer dependency.

## Usage

Import `createStore` from this package and select the state a template needs with `<const-selected>`:

```marko
import { createStore } from "marko-tanstack-store";

static const counter = createStore(
  { count: 0, label: "Count" },
  ({ setState }) => ({
    increment: () =>
      setState((state) => ({ ...state, count: state.count + 1 })),
  }),
);

<const-selected/count=(state) => state.count store=() => counter/>

<button onClick() {
  counter.actions.increment();
}>
  ${count}
</button>
```

The expression assigned to `<const-selected>` is its default `value` input. The `/count` portion names the returned reactive tag variable.

### Declaring a store

Declare shared stores with Marko's `static` syntax and pass each source through an inline getter. Marko then creates the store independently in the server and browser bundles instead of trying to serialize the instance:

```marko
import { createStore } from "marko-tanstack-store";

static const counter = createStore({ count: 0 });

<const-selected/count=(state) => state.count store=() => counter/>

<button onClick() {
  counter.setState((state) => ({ ...state, count: state.count + 1 }));
}>
  ${count}
</button>
```

Stores can instead be module-scoped exports from a regular TypeScript file. Import the store into the template and reference it from the same inline getter; each target bundles and instantiates the module independently.

Calling the JavaScript API directly preserves all of TanStack's overloads and inferred return types for mutable, action, and readonly derived stores.

### Creating and using an atom

Declare an atom statically and use `<let-atom>` to expose it as one writable tag variable. Its default `value` input is an inline getter. `<let-atom>` uses Marko's `value`/`valueChange` binding instead of a `[state, setState]` tuple:

```marko
import { createAtom } from "marko-tanstack-store";

static const countAtom = createAtom(0);

<let-atom/count=() => countAtom/>

<button onClick() {
  count += 5;
}>
  ${count}
</button>
```

Assigning to `count` calls `countAtom.set()`; updates made directly through the atom also flow back into `count`. Use `<const-selected/value=(state) => state store=() => computedAtom/>` to observe readonly or computed atoms.

### Selecting values

Selectors can return any value:

```marko
<const-selected/incomplete=(state) =>
  state.todos.filter((todo) => !todo.complete)
  store=() => todoStore
/>

<for|todo| of=incomplete>
  <p>${todo.title}</p>
</for>
```

## API

### `<let-atom>`

```marko
<let-atom/value=() => atom/>
```

| Input     | Type                                | Description                                          |
| --------- | ----------------------------------- | ---------------------------------------------------- |
| `value`   | `() => Atom<T>`                     | Default input getter returning the atom to observe.  |
| `compare` | `(previous: T, next: T) => boolean` | Optional equality function; defaults to `Object.is`. |

Returns the atom's current `T` as a reactive, writable tag variable. Custom comparison controls which atom values are published without disabling writes. Assignments are forwarded to `atom.set()` through Marko's `valueChange` convention:

```marko
<let-atom/count=() => atom/>
<button onClick() {
  count += 5;
}>
  Add five
</button>
```

Use `<const-selected>` for readonly and computed atoms.

### `<const-selected>`

Select part of a source:

```marko
<const-selected/selected=(state) => state.someValue store=() => store/>
```

Omit the selector to observe the complete source value:

```marko
<const-selected/state store=() => store/>
```

| Input     | Type                                                | Description                                               |
| --------- | --------------------------------------------------- | --------------------------------------------------------- |
| `value`   | `(state: TState) => TSelected`                      | Optional default input; omitted means identity selection. |
| `store`   | `() => Readable<TState>`                            | Inline getter returning the store or atom to observe.     |
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

<const-selected/user=(state) => state.user store=() => store compare=shallow/>
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

TanStack Store instances wrap atoms, while atom objects contain methods and reactive-graph state. Neither can cross Marko's server-resume serialization boundary as a usable source. Declare stores and atoms as module-scoped TypeScript exports or with Marko's `static` syntax, then reference them through inline getters so Marko includes equivalent definitions in both bundles.

Static definitions are process-wide in each target. A render-owned `<const/store=createStore(...)>` cannot resume because its instance is not serializable; `store=() => store` must refer to a statically reconstructable source. Initial state must therefore be deterministic across the server and browser. Request-scoped state needs a separate first-class recreation and hydration API.
