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

let requestNumber = 0;

export function listBooks() {
  requestNumber++;
  return {
    books,
    requestNumber,
    servedAt: new Date().toISOString(),
  };
}
