import { fireEvent, render, screen, waitFor } from "@marko/testing-library";
import { describe, expect, test, vi } from "vitest";

import BasicForm from "./fixtures/basic-form.marko";

describe("const-form and const-field tags", () => {
  test("renders default values and publishes field changes", async () => {
    await render(BasicForm, { onSubmit: vi.fn() });

    const field = screen.getByRole("textbox", { name: "First name" });
    expect((field as HTMLInputElement).value).toBe("");

    await fireEvent.input(field, { target: { value: "Ada" } });

    await waitFor(() => {
      expect(screen.getByTestId("field-value").textContent).toBe("Ada");
      expect(screen.getByTestId("form-value").textContent).toBe("Ada");
    });
  });

  test("validates on blur and updates submit readiness", async () => {
    await render(BasicForm, { onSubmit: vi.fn() });

    const field = screen.getByRole("textbox", { name: "First name" });
    await fireEvent.input(field, { target: { value: "A" } });
    await fireEvent.blur(field);

    expect(await screen.findByText("First name is too short")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    await fireEvent.input(field, { target: { value: "Ada" } });
    await fireEvent.blur(field);

    await waitFor(() => {
      expect(screen.queryByText("First name is too short")).toBeNull();
      expect(
        (screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });
  });

  test("submits current values and resets the form", async () => {
    const onSubmit = vi.fn();
    await render(BasicForm, { onSubmit });

    const field = screen.getByRole("textbox", { name: "First name" });
    await fireEvent.input(field, { target: { value: "Grace" } });
    await fireEvent.submit(field.closest("form")!);

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ firstName: "Grace" }),
    );

    await fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect((field as HTMLInputElement).value).toBe(""));
  });

  test("keeps the field mounted while its state changes", async () => {
    const onFieldMount = vi.fn();
    const onFieldUnmount = vi.fn();
    await render(BasicForm, {
      onSubmit: vi.fn(),
      onFieldMount,
      onFieldUnmount,
    });

    const field = screen.getByRole("textbox", { name: "First name" });
    expect(onFieldMount).toHaveBeenCalledOnce();
    expect(onFieldUnmount).not.toHaveBeenCalled();

    await fireEvent.input(field, { target: { value: "Ada" } });
    await fireEvent.blur(field);

    expect(onFieldMount).toHaveBeenCalledOnce();
    expect(onFieldUnmount).not.toHaveBeenCalled();
  });

  test("unmounts a conditional field", async () => {
    const onFieldUnmount = vi.fn();
    const result = await render(BasicForm, {
      onSubmit: vi.fn(),
      onFieldUnmount,
      showField: true,
    });

    await result.rerender({
      onSubmit: vi.fn(),
      onFieldUnmount,
      showField: false,
    });

    expect(onFieldUnmount).toHaveBeenCalledOnce();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
