import { addBook, type AddBookInput, listBooks } from "../../../books.js";

export const GET: MarkoRun.GET = Run.GET(() =>
  Response.json(listBooks(), {
    headers: { "cache-control": "no-store" },
  }),
);

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
