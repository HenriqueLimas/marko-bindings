# marko-jotai

Jotai bindings for Marko 6.

The package owns its Jotai dependency and re-exports Jotai's framework-independent `jotai/vanilla` API, so applications only need to install `marko-jotai`. Supported utilities are available from `marko-jotai/utils`.

## Install

```sh
pnpm add marko-jotai
```

`marko` remains a peer dependency.

## Usage

Create a writable atom, then expose its value with `<use-atom>`:

```marko
import { atom } from "marko-jotai";

<const/countAtom=atom(0)>
<use-atom/count=countAtom/>

<button onClick() {
  count++;
}>
  ${count}
</button>
```

The `/count` portion names the returned reactive tag variable. Assigning to `count` writes through to the Jotai atom, and store updates flow back into `count`.

Like Jotai's React hooks, both tags use `getDefaultStore()` when `store` is omitted. Pass an explicit store when state needs its own owner or request boundary.

### Async atoms

Use `<use-atom-value>` for a readable async atom. Its body parameter is the resolved value, and its internal `<await>` activates the surrounding `<try>` pending and error UI:

```marko
import { atom } from "marko-jotai";

export interface Input {
  numPromise: Promise<number>;
}

<const/asyncAtom=atom(() => input.numPromise)>

<try>
  <use-atom-value|num|=asyncAtom><output>${num}</output></use-atom-value>

  <@placeholder>Loading...</@placeholder>
  <@catch|error|>${String(error)}</@catch>
</try>
```

Writable async atoms can use the same body-parameter form with `<use-atom>`:

```marko
<const/asyncAtom=atom(input.numPromise)>

<try>
  <use-atom|num|=asyncAtom><output>${num}</output></use-atom>

  <@placeholder>Loading...</@placeholder>
  <@catch|error|>${String(error)}</@catch>
</try>
```

## API

### `<use-atom>`

```marko
<use-atom/value=atom/>

<use-atom|value|=atom>
  <!-- render with value -->
</use-atom>
```

| Input     | Type                             | Description                                      |
| --------- | -------------------------------- | ------------------------------------------------ |
| `value`   | `WritableAtom<T, [T], unknown>`  | Default input containing the writable atom.      |
| `store`   | `ReturnType<typeof createStore>` | Optional store; defaults to `getDefaultStore()`. |
| `content` | `Marko.Body<[Awaited<T>]>`       | Optional body receiving the resolved atom value. |

The `/value` form returns the atom's current `T` as a reactive, writable tag variable. The `|value|` form renders body content with `Awaited<T>` and resolves promises through an internal `<await>`. The tag subscribes with `store.sub()` and unsubscribes when it leaves the document.

Atoms whose write function requires multiple arguments do not map to a single Marko assignment and are not accepted by this initial API.

### `<use-atom-value>`

```marko
<use-atom-value/value=atom/>

<use-atom-value|value|=atom>
  <!-- render with value -->
</use-atom-value>
```

| Input     | Type                             | Description                                      |
| --------- | -------------------------------- | ------------------------------------------------ |
| `value`   | `Atom<T>`                        | Default input containing any readable atom.      |
| `store`   | `ReturnType<typeof createStore>` | Optional store; defaults to `getDefaultStore()`. |
| `content` | `Marko.Body<[Awaited<T>]>`       | Optional body receiving the resolved atom value. |

The `/value` form returns the atom's current `T` as a reactive, read-only tag variable. For async atoms this is the raw promise. The `|value|` form resolves promise values through `<await>` and passes `Awaited<T>` to its body.

### JavaScript exports

```js
import { atom, createStore, getDefaultStore } from "marko-jotai";
```

The complete `jotai/vanilla` entrypoint is re-exported; React is not required.

### Utilities

`atomWithStorage` is available from the utilities entrypoint and works with `<use-atom>`:

```marko
import { atomWithStorage } from "marko-jotai/utils";

<const/countAtom=atomWithStorage("count", 0)>
<use-atom/count=countAtom/>
```

## Server rendering

A Jotai atom and store can be read during rendering, but their closures cannot cross a Marko server-resume serialization boundary. The default store is process-wide, so pass an explicitly owned store for request-specific server state.
