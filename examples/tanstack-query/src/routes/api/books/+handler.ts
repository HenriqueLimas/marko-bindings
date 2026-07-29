import { listBooks } from "../../../books.js";

export const GET: MarkoRun.GET = Run.GET(() =>
  Response.json(listBooks(), {
    headers: { "cache-control": "no-store" },
  }),
);
