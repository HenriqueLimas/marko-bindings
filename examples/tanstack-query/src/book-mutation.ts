import type { MutationObserverOptions } from "@marko-bindings/tanstack-query";

import { BOOKS_QUERY_KEY } from "./books-query.js";
import type { AddBookInput, AddBookResponse } from "./books.js";

export function addBookMutation(
  apiUrl: string,
): MutationObserverOptions<AddBookResponse, Error, AddBookInput> {
  return {
    mutationKey: ["add-book"],
    mutationFn: async (book) => {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(book),
      });

      if (!response.ok) {
        throw new Error(`Books API returned ${response.status}.`);
      }

      return response.json() as Promise<AddBookResponse>;
    },
    onSuccess: (_data, _variables, _onMutateResult, { client }) =>
      client.invalidateQueries({ queryKey: BOOKS_QUERY_KEY }),
  };
}
