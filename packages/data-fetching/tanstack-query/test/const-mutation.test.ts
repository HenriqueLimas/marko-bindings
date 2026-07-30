import { fireEvent, render, screen, waitFor } from "@marko/testing-library";
import { QueryClient } from "@marko-bindings/tanstack-query";
import { describe, expect, test, vi } from "vitest";

import ConstMutation from "./fixtures/const-mutation.marko";
import ConstMutationWithoutResult from "./fixtures/const-mutation-without-result.marko";
import InitializedConstMutation from "./fixtures/initialized-const-mutation.marko";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
};

describe("const-mutation tag", () => {
  test("executes a mutation and publishes its state", async () => {
    const pending = deferred<string>();
    const mutationFn = vi.fn(() => pending.promise);
    const mutation = vi.fn(() => ({ mutationFn }));

    await render(ConstMutation, {
      client: () => new QueryClient(),
      mutation,
    });

    expect(screen.getByText("Idle")).toBeTruthy();
    expect(mutation).not.toHaveBeenCalled();
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    expect(screen.getByText("Loading...")).toBeTruthy();
    expect(mutation).toHaveBeenCalledOnce();
    expect(mutationFn).toHaveBeenCalledWith(
      { greeting: "Hello, Marko" },
      expect.objectContaining({ client: expect.any(QueryClient) }),
    );

    pending.resolve("Hello, Marko");
    expect(await screen.findByText("Hello, Marko")).toBeTruthy();
  });

  test("uses the initialized client when no client input is passed", async () => {
    const client = new QueryClient();

    await render(InitializedConstMutation, {
      client: () => client,
      mutation: () => ({
        mutationFn: async ({ greeting }) => greeting,
      }),
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Mutate initialized" }),
    );

    expect(await screen.findByText("Initialized greeting")).toBeTruthy();
    expect(client.getMutationCache().getAll()).toHaveLength(1);
  });

  test("returns mutate without requiring the result", async () => {
    const mutationFn = vi.fn(
      async ({ greeting }: { greeting: string }) => greeting,
    );

    await render(ConstMutationWithoutResult, {
      client: () => new QueryClient(),
      mutation: () => ({ mutationFn }),
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Mutate without result" }),
    );

    await waitFor(() => expect(mutationFn).toHaveBeenCalledOnce());
  });

  test("runs default and per-execution callbacks", async () => {
    const defaultSuccess = vi.fn();
    const executionSuccess = vi.fn();
    const client = new QueryClient();

    await render(ConstMutation, {
      client: () => client,
      mutation: () => ({
        mutationFn: async ({ greeting }) => greeting,
        mutationKey: ["greeting"],
        onSuccess: defaultSuccess,
      }),
      mutateOptions: { onSuccess: executionSuccess },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    await waitFor(() => expect(defaultSuccess).toHaveBeenCalledOnce());
    expect(executionSuccess).toHaveBeenCalledOnce();
    expect(defaultSuccess).toHaveBeenCalledWith(
      "Hello, Marko",
      { greeting: "Hello, Marko" },
      undefined,
      expect.objectContaining({
        client,
        mutationKey: ["greeting"],
      }),
    );
  });

  test("keeps the result from the latest overlapping execution", async () => {
    const executions = [deferred<string>(), deferred<string>()];
    const client = new QueryClient();
    let execution = 0;

    await render(ConstMutation, {
      client: () => client,
      mutation: () => ({
        mutationFn: () => executions[execution++].promise,
      }),
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    executions[1].resolve("Latest greeting");
    expect(await screen.findByText("Latest greeting")).toBeTruthy();

    executions[0].resolve("Stale greeting");
    await waitFor(() =>
      expect(screen.queryByText("Stale greeting")).toBeNull(),
    );
    expect(screen.getByText("Latest greeting")).toBeTruthy();
  });

  test("publishes an error from a failed mutation", async () => {
    await render(ConstMutation, {
      client: () => new QueryClient(),
      mutation: () => ({
        mutationFn: async () => {
          throw new Error("Mutation failed");
        },
      }),
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    expect(await screen.findByText("Error: Mutation failed")).toBeTruthy();
  });

  test("resets the published mutation state", async () => {
    await render(ConstMutation, {
      client: () => new QueryClient(),
      mutation: () => ({ mutationFn: async () => "Hello, Marko" }),
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));
    expect(await screen.findByText("Hello, Marko")).toBeTruthy();

    await fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByText("Idle")).toBeTruthy();
  });

  test("logs and rejects when the client getter returns undefined", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await render(ConstMutation, {
      client: () => undefined,
      mutation: () => ({ mutationFn: async () => "Unused" }),
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    expect(consoleError).toHaveBeenCalledWith(
      "<const-mutation> requires a client input.",
    );
    expect(
      await screen.findByText(
        "Error: <const-mutation> requires a client input.",
      ),
    ).toBeTruthy();
    consoleError.mockRestore();
  });

  test("logs and rejects when the mutation getter is missing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await render(ConstMutation, {
      client: () => new QueryClient(),
      // @ts-expect-error Exercise the runtime diagnostic for invalid callers.
      mutation: {},
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));

    expect(consoleError).toHaveBeenCalledWith(
      "<const-mutation> requires a mutation input.",
    );
    expect(
      await screen.findByText(
        "Error: <const-mutation> requires a mutation input.",
      ),
    ).toBeTruthy();
    consoleError.mockRestore();
  });

  test("unsubscribes and unmounts the client when removed", async () => {
    const client = new QueryClient();
    const getClient = () => client;
    const mutation = () => ({ mutationFn: async () => "Hello, Marko" });
    const unmount = vi.spyOn(client, "unmount");
    const rendered = await render(ConstMutation, {
      client: getClient,
      mutation,
    });
    await fireEvent.click(screen.getByRole("button", { name: "Mutate" }));
    await screen.findByText("Hello, Marko");

    await rendered.rerender({
      client: getClient,
      mutation,
      show: false,
    });

    await waitFor(() => expect(unmount).toHaveBeenCalledOnce());
  });
});
