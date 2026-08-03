import { createFileRoute } from "@marko-bindings/tanstack-router";

export const Route = createFileRoute("/about")({
  loader: () => ({ renderedAt: new Date().toISOString() }),
});
