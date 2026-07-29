# @marko-bindings/jotai

Jotai bindings for Marko 6.

The package owns its Jotai dependency and re-exports Jotai's framework-independent `jotai/vanilla` API, so applications only need to install `@marko-bindings/jotai`. The complete `jotai/vanilla/utils` entrypoint is available from `@marko-bindings/jotai/utils`.

## Install

```sh
pnpm add @marko-bindings/jotai
```

`marko` remains a peer dependency.

## Usage

Create a writable atom, then expose its value with `<let-atom>`:

```marko
import { atom } from "@marko-bindings/jotai";

static const countAtom = atom(0);

<let-atom/count=() => countAtom/>

<button onClick() {
  count++;
}>
  ${count}
</button>
```

The `/count` portion names the returned reactive tag variable. Assigning to `count` writes through to the Jotai atom, and store updates flow back into `count`.

Atom and store inputs are zero-argument getters. Write them inline so Marko can reconstruct their dependencies in both the server and browser bundles. Like Jotai's React hooks, the tags use `getDefaultStore()` when no store is initialized or passed. Initialize an explicit store once to make it the render-wide default:

```marko
import { createStore } from "@marko-bindings/jotai";

static const store = createStore();

<init-jotai-store=() => store/>
<let-atom/count=() => countAtom/>
```

### Async atoms

Use `<await-atom>` for readable or writable async atoms. Its body parameter receives the resolved value, and its internal `<await>` activates the surrounding `<try>` pending and error UI:

```marko
import { atom } from "@marko-bindings/jotai";

static const asyncAtom = atom(Promise.resolve(42));

<try>
  <await-atom|num|=() => asyncAtom><output>${num}</output></await-atom>

  <@placeholder>Loading...</@placeholder>
  <@catch|error|>${String(error)}</@catch>
</try>
```

The resolved body parameter is read-only even when the source atom is writable. Use a separate synchronous writable atom when the rendered view needs assignment semantics.

## API

### `<init-jotai-store>`

```marko
<init-jotai-store/store=() => store/>
```

Calls the required `value` getter during server rendering and again in the
browser, stores the runtime-local Jotai store as the render-wide default, and
returns it. Render it before atom tags that should use the store. Explicit
`store` inputs override the initialized store; without either, tags continue to
use Jotai's `getDefaultStore()`.

### `<let-atom>`

```marko
<let-atom/value=() => atom/>
```

| Input   | Type                                                | Description                                                   |
| ------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `value` | `() => WritableAtom<T, [NoInfer<T>], unknown>`      | Inline getter returning the writable atom.                    |
| `store` | `() => ReturnType<typeof createStore> \| undefined` | Optional override for the initialized or Jotai default store. |

Returns the atom's current `T` as a reactive, writable tag variable. The tag subscribes with `store.sub()` and unsubscribes when it leaves the document. Use `<await-atom>` instead when the atom value is asynchronous.

Atoms whose write function requires multiple arguments do not map to a single Marko assignment and are not accepted by this initial API.

### `<const-atom>`

```marko
<const-atom/value=() => atom/>
```

| Input   | Type                                                | Description                                                   |
| ------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `value` | `() => Atom<T>`                                     | Inline getter returning a readable atom.                      |
| `store` | `() => ReturnType<typeof createStore> \| undefined` | Optional override for the initialized or Jotai default store. |

Returns the atom's current `T` as a reactive, read-only tag variable. Use `<await-atom>` to resolve asynchronous values inside a Marko async boundary.

### `<await-atom>`

```marko
<await-atom|value|=() => atom>
  <!-- render with the resolved value -->
</await-atom>
```

| Input     | Type                                                | Description                                                   |
| --------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `value`   | `() => Atom<T>`                                     | Inline getter returning a readable or writable atom.          |
| `store`   | `() => ReturnType<typeof createStore> \| undefined` | Optional override for the initialized or Jotai default store. |
| `content` | `Marko.Body<[Awaited<T>]>`                          | Required body receiving the resolved atom value.              |

Observes the atom, resolves its current value through an internal `<await>`, and renders its body inside that async boundary. Promise changes reactivate the surrounding `<try>` placeholder, and rejections reach its catch block. The tag returns no tag variable.

### `<const-reset-atom>`

```marko
<const-reset-atom/reset=() => atom/>
```

| Input   | Type                                                | Description                                                   |
| ------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `value` | `() => WritableAtom<unknown, [typeof RESET], T>`    | Inline getter returning an atom that can reset.               |
| `store` | `() => ReturnType<typeof createStore> \| undefined` | Optional override for the initialized or Jotai default store. |

Returns a zero-argument function that resets the atom by writing Jotai's `RESET` symbol. It works with utilities such as `atomWithReset` and `atomWithStorage`.

### JavaScript exports

```js
import { atom, createStore, getDefaultStore } from "@marko-bindings/jotai";
```

The complete `jotai/vanilla` entrypoint is re-exported; React is not required.

### Utilities

`unwrap` converts an async atom into a synchronous atom. Its value is `undefined` while the promise is pending unless a fallback function is provided:

```marko
import { atom } from "@marko-bindings/jotai";
import { unwrap } from "@marko-bindings/jotai/utils";

static const asyncAtom = atom(Promise.resolve(42));
static const unwrappedAtom = unwrap(asyncAtom);

<const-atom/num=() => unwrappedAtom/>

<if=num === undefined>Loading...</if>
<if=num !== undefined>${num}</if>
```

Pass a fallback such as `(previous) => previous` to retain the last resolved value while a replacement promise is pending.

`atomWithObservable` creates a readable atom from an observable. Without an
`initialValue`, its value is a promise until the observable emits for the first
time. Use `<await-atom>` so its internal `<await>` activates the surrounding
`<try>` placeholder and catch blocks:

```marko
import { atomWithObservable } from "@marko-bindings/jotai/utils";
import { count$ } from "./count-observable.js";

static const countAtom = atomWithObservable(() => count$);

<try>
  <await-atom|count|=() => countAtom><output>${count}</output></await-atom>

  <@placeholder>Waiting for first value...</@placeholder>
  <@catch|error|>${String(error)}</@catch>
</try>
```

There is no need to add another `<await>` inside `<await-atom>`. Pass
`{ initialValue: 0 }` as the second argument to `atomWithObservable` when the
first render should be synchronous; later observable emissions update the tag
normally. If the factory returns a subject, Jotai creates a writable atom that
can instead be used with `<let-atom>`.

`atomWithReset` creates a writable atom that can return to its initial value with `<const-reset-atom>`:

```marko
import { atomWithReset } from "@marko-bindings/jotai/utils";

static const countAtom = atomWithReset(1);

<let-atom/count=() => countAtom/>
<const-reset-atom/reset=() => countAtom/>

<output>${count}</output>
<button onClick() {
  count++;
}>
  Increment
</button>
<button onClick=reset>Reset</button>
```

`atomWithLazy` defers creation of an atom's initial value until a store first reads it. It works with `<let-atom>` like any other writable atom:

```marko
import { atomWithLazy } from "@marko-bindings/jotai/utils";

static const countAtom = atomWithLazy(() => 40);

<let-atom/count=() => countAtom/>

<button onClick() {
  count++;
}>
  ${count}
</button>
```

The initializer runs once for each store that reads the atom.

`atomWithStorage` is also available from the utilities entrypoint:

```marko
import { atomWithStorage } from "@marko-bindings/jotai/utils";

static const countAtom = atomWithStorage("count", 0);

<let-atom/count=() => countAtom/>
```

## Server rendering

Jotai atoms and stores contain closures that cannot cross Marko's server-resume serialization boundary. Declare atom definitions with Marko's `static` syntax and reference them through inline getters so Marko includes them in both bundles.

The Jotai default store and statically declared initialized stores are process-wide in each target. A render-owned `<const/store=createStore()>` cannot resume because its closure is not serializable; initializer and explicit store getters must refer to statically reconstructable stores.
