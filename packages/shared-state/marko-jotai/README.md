# marko-jotai

Jotai bindings for Marko 6.

The package owns its Jotai dependency and re-exports Jotai's framework-independent `jotai/vanilla` API, so applications only need to install `marko-jotai`. Supported utilities are available from `marko-jotai/utils`.

## Install

```sh
pnpm add marko-jotai
```

`marko` remains a peer dependency.

## Usage

Create the atom and its explicitly owned store, then expose the atom's value with `<use-atom>`:

```marko
import { atom, createStore } from "marko-jotai";

<const/store=createStore()>
<const/countAtom=atom(0)>
<use-atom/count=countAtom store=store/>

<button onClick() {
  count++;
}>
  ${count}
</button>
```

The `/count` portion names the returned reactive tag variable. Assigning to `count` writes through to the Jotai atom, so separate `use-atom-state` and `use-atom-value` tags are unnecessary. Updates made through `store.set()` also flow back into `count`.

A store is required instead of falling back to Jotai's process-wide default store. This keeps ownership and request isolation explicit.

## API

### `<use-atom>`

```marko
<use-atom/value=atom store=store/>
```

| Input   | Type                             | Description                                   |
| ------- | -------------------------------- | --------------------------------------------- |
| `value` | `WritableAtom<T, [T], unknown>`  | Default input containing the atom to observe. |
| `store` | `ReturnType<typeof createStore>` | Store that owns the atom's state.             |

Returns the atom's current `T` as a reactive, writable tag variable. The tag reads with `store.get()`, subscribes with `store.sub()`, forwards assignments through `store.set()`, and unsubscribes when it leaves the document.

Atoms whose write function requires multiple arguments do not map to a single Marko assignment and are not accepted by this initial API.

### JavaScript exports

```js
import { atom, createStore, getDefaultStore } from "marko-jotai";
```

The complete `jotai/vanilla` entrypoint is re-exported; React is not required.

### Utilities

`atomWithStorage` is available from the utilities entrypoint and works with `<use-atom>`:

```marko
import { atomWithStorage } from "marko-jotai/utils";
import { createStore } from "marko-jotai";

<const/store=createStore()>
<const/countAtom=atomWithStorage("count", 0)>
<use-atom/count=countAtom store=store/>
```

## Server rendering

A Jotai atom and store can be read during rendering, but their closures cannot cross a Marko server-resume serialization boundary. Create stores in the scope that owns them and avoid process-wide stores for request-specific state.
