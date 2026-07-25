import { ApolloServer, HeaderMap } from "@apollo/server";

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

const server = new ApolloServer({
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
const serverStarted = server.start();

const handleGraphQLRequest: MarkoRun.Handler = async ({ request, url }) => {
  const headers = new HeaderMap();
  request.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  let body: unknown;
  if (request.method === "POST") {
    const contentType = request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      .trim();

    if (contentType !== "application/json") {
      return Response.json(
        { errors: [{ message: "Content-Type must be application/json" }] },
        { status: 415 },
      );
    }

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { errors: [{ message: "Request body must be valid JSON" }] },
        { status: 400 },
      );
    }
  }

  await serverStarted;
  const result = await server.executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: request.method,
      headers,
      search: url.search,
      body,
    },
    context: async () => ({}),
  });

  const responseHeaders = new Headers();
  for (const [key, value] of result.headers) {
    responseHeaders.set(key, value);
  }

  const responseBody = result.body;
  if (responseBody.kind === "complete") {
    return new Response(responseBody.string, {
      status: result.status ?? 200,
      headers: responseHeaders,
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of responseBody.asyncIterator) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    status: result.status ?? 200,
    headers: responseHeaders,
  });
};

export const GET = handleGraphQLRequest;
export const POST = handleGraphQLRequest;
