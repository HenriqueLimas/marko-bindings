# Shared-state bindings

Bindings for stores, query caches, signals, and other state shared across a Marko subtree or request.

Packages in this group should make ownership and request isolation explicit. Avoid process-wide state by default, and ensure subscriptions are disposed with the owning tag.

## Packages

- [`marko-jotai`](marko-jotai) — Jotai atoms with native Marko reactive bindings.
- [`marko-tanstack-store`](marko-tanstack-store) — TanStack stores and atoms with native Marko reactive bindings.
