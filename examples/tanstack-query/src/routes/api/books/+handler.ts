import { addBook, type AddBookInput, listBooks } from "../../../books.js";

export const GET = Run.GET(async ({ url }) => {
  const requestedDelay = Number(url.searchParams.get("delay"));
  const delay = Number.isFinite(requestedDelay)
    ? Math.min(Math.max(requestedDelay, 0), 2_000)
    : 0;
  if (delay) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return Response.json(listBooks(), {
    headers: { "cache-control": "no-store" },
  });
});

export const POST: MarkoRun.Handler = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const input = body as Partial<AddBookInput> | null;
  if (
    !input ||
    typeof input.title !== "string" ||
    !input.title.trim() ||
    typeof input.author !== "string" ||
    !input.author.trim()
  ) {
    return Response.json(
      { error: "A title and author are required." },
      { status: 400 },
    );
  }

  return Response.json(
    addBook({ title: input.title.trim(), author: input.author.trim() }),
    { status: 201 },
  );
};
