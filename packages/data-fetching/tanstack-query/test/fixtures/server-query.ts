import type { QueryObserverOptions } from "@marko-bindings/tanstack-query";

interface Greeting {
  greeting: string;
}

export const greetingQuery = (): QueryObserverOptions<Greeting> => ({
  queryKey: ["server-greeting"],
  queryFn: async () => ({ greeting: "Hello from the server" }),
  staleTime: Infinity,
});
