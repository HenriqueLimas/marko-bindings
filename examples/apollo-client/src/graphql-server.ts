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
  `,
  resolvers: {
    Query: {
      books: () => books,
    },
  },
});

export const serverStarted = server.start();
