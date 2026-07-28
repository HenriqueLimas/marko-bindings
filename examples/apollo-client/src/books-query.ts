import { gql, type TypedDocumentNode } from "marko-apollo-client";

export interface Book {
  id: string;
  title: string;
  author: string;
}

export interface BooksQuery {
  books: Book[];
}

export const BOOKS_QUERY: TypedDocumentNode<BooksQuery> = gql`
  query Books {
    books {
      id
      title
      author
    }
  }
`;
