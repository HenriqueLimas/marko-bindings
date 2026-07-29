export interface Book {
  id: string;
  title: string;
  author: string;
}

export interface BooksResponse {
  books: Book[];
  requestNumber: number;
  servedAt: string;
}

const books: Book[] = [
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

let requestNumber = 0;

export function listBooks(): BooksResponse {
  requestNumber += 1;

  return {
    books: books.map((book) => ({ ...book })),
    requestNumber,
    servedAt: new Date().toISOString(),
  };
}
