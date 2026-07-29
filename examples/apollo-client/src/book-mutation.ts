import { gql, type TypedDocumentNode } from "@marko-bindings/apollo-client";

import type { Book } from "./books-query";

export interface AddBookMutation {
  addBook: Book;
}

export interface AddBookVariables {
  title: string;
  author: string;
}

export const ADD_BOOK: TypedDocumentNode<AddBookMutation, AddBookVariables> =
  gql`
    mutation AddBook($title: String!, $author: String!) {
      addBook(title: $title, author: $author) {
        id
        title
        author
      }
    }
  `;
