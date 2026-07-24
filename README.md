# Marko Bindings

Tag-first bindings that make JavaScript libraries feel native in **Marko 6**.

The goal is not to expose framework-agnostic libraries through thin function wrappers. Each package should provide an idiomatic Marko tag API, own the relevant lifecycle and cleanup behavior, and preserve Marko's server/client model.

## Package groups

| Group                                             | Purpose                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| [`shared-state`](packages/shared-state/README.md) | Stores, caches, signals, and server/client state coordination        |
| [`routing`](packages/routing/README.md)           | Routers, navigation, route matching, and URL state                   |
| [`ui`](packages/ui/README.md)                     | Headless UI, component systems, overlays, and interaction primitives |
| [`forms`](packages/forms/README.md)               | Form state, validation, field composition, and submission            |

A binding lives at `packages/<group>/<library>` and is published independently. The group is organizational and does not become another package layer.

```text
packages/
├── forms/
├── routing/
├── shared-state/
└── ui/
```

## Principles

- **Tags are the public API.** Prefer composable tags and tag parameters over imperative setup APIs.
- **Marko 6 only.** New code uses the tags API, typed inputs, and current Marko syntax rather than class components.
- **Progressive enhancement matters.** Keep server rendering useful and isolate browser-only behavior.
- **Own the lifecycle.** Subscriptions, effects, and library instances must be scoped and cleaned up by the binding.
- **Make dependency ownership explicit.** Keep `marko` as a peer. Upstream libraries may be dependencies when a binding deliberately re-exports their API as a single-install package; otherwise prefer peers.
- **Packages stay independent.** Each binding has its own tests, changelog, version, and release.

## Development

Requirements: Node.js 22.12 or newer and pnpm 11 or newer.

```sh
pnpm install
pnpm check
pnpm build
```

Useful commands:

- `pnpm format` — format the repository
- `pnpm typecheck` — type-check every package that defines a `typecheck` script
- `pnpm test` — test every package that defines a `test` script
- `pnpm changeset` — describe a publishable change

See [Creating a binding package](docs/creating-a-binding.md) before adding the first integration.
