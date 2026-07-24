# Contributing

## Before implementing a binding

1. Pick the package group by the library's primary responsibility.
2. Sketch the Marko tag API before adapting the library's native API.
3. Decide what renders on the server and what activates in the browser.
4. Document ownership of instances, subscriptions, and cleanup.
5. Add a changeset for every change that affects a published package.

## Quality bar

Every binding should include:

- typed Marko tag inputs and tag parameters;
- tests for rendering, updates, teardown, and relevant SSR behavior;
- a README showing the tag API rather than only low-level JavaScript;
- `marko` and the wrapped library as peer dependencies;
- package scripts for `build`, `typecheck`, and `test` when applicable.

Run `pnpm check` and `pnpm build` before opening a pull request.

See [docs/creating-a-binding.md](docs/creating-a-binding.md) for the package contract.
