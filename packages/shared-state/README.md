# Shared-state bindings

Bindings for stores, query caches, signals, and other state shared across a Marko subtree or request.

Packages in this group should make ownership and request isolation explicit. Avoid process-wide state by default, and ensure subscriptions are disposed with the owning tag.
