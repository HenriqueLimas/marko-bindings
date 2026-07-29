import { gql, type TypedDocumentNode } from "marko-apollo-client";

export interface Book {
  __typename: "Book";
  id: string;
  title: string;
  author: string;
}

export interface BooksQuery {
  books: Book[];
}

export const BOOK_FRAGMENT: TypedDocumentNode<Book> = gql`
  fragment BookFields on Book {
    id
    title
    author
  }
`;

export const BOOKS_QUERY: TypedDocumentNode<BooksQuery> = gql`
  query Books {
    books {
      ...BookFields
    }
  }
  ${BOOK_FRAGMENT}
`;
