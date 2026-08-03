import { createFileRoute } from "@marko-bindings/tanstack-router";

export const Route = createFileRoute("/posts/$postId")({
  loader: ({ params }) => ({
    title: `Post ${params.postId}`,
    body: "Params and loader data stay local to the active route.",
  }),
});
