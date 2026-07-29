# Jotai task planner with Marko Run

This example uses `marko-jotai` to build a small task planner in a Marko Run
application. It demonstrates:

- writable task and filter state with `<let-atom>`;
- read-only filtered tasks and progress with `<const-atom>`;
- resetting an `atomWithReset` with `<const-reset-atom>`; and
- one explicit Jotai store shared by every binding on the page.

The atoms and store are static definitions, so Marko creates them independently
in its server and browser bundles. Every binding receives simple inline getters
such as `value=() => progressAtom store=() => store`, allowing the complete
planner to be server-rendered and resumed.

```sh
pnpm --filter @marko-bindings/example-jotai dev
```

Open <http://localhost:3000>, then add, complete, remove, filter, or reset tasks.
Assignments to the writable `tasks` and `selectedFilter` tag variables write
through to Jotai; changes to those atoms automatically recompute the derived
atoms and update the Marko view.
