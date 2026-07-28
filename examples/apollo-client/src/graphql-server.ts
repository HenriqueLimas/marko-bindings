import { ApolloServer } from "@apollo/server";

const books = [
  {
    id: "the-left-hand-of-darkness",
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
  },
  {
    id: "the-dispossessed",
    title: "The Dispossessed",
    author: "Ursula K. Le Guin",
  },
  {
    id: "parable-of-the-sower",
    title: "Parable of the Sower",
    author: "Octavia E. Butler",
  },
];

export const server = new ApolloServer({
  typeDefs: `#graphql
    type Book {
      id: ID!
      title: String!
      author: String!
    }

    type Query {
      books: [Book!]!
    }

    type Mutation {
      addBook(title: String!, author: String!): Book!
    }
  `,
  resolvers: {
    Query: {
      books: () => books,
    },
    Mutation: {
      addBook: (_parent: unknown, input: { title: string; author: string }) => {
        const book = {
          id: input.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
          title: input.title,
          author: input.author,
        };
        books.push(book);
        return book;
      },
    },
  },
});

export const serverStarted = server.start();
