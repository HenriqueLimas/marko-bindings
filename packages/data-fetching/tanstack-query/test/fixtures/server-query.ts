import type { QueryObserverOptions } from "@marko-bindings/tanstack-query";

interface Greeting {
  greeting: string;
}

export const greetingQuery = (): QueryObserverOptions<Greeting> => ({
  queryKey: ["server-greeting"],
  queryFn: async () => ({ greeting: "Hello from the server" }),
  staleTime: Infinity,
});

let resolvePendingGreeting: ((value: Greeting) => void) | undefined;

export const pendingGreetingQuery = (): QueryObserverOptions<Greeting> => ({
  queryKey: ["pending-server-greeting"],
  queryFn: () =>
    new Promise<Greeting>((resolve) => {
      resolvePendingGreeting = resolve;
    }),
  staleTime: Infinity,
});

export function hasPendingGreeting() {
  return !!resolvePendingGreeting;
}

export function finishPendingGreeting() {
  resolvePendingGreeting?.({ greeting: "Hello from the server" });
  resolvePendingGreeting = undefined;
}
