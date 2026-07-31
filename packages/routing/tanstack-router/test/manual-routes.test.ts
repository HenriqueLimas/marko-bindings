import { fireEvent, render, screen } from "@marko/testing-library";
import { expect, test } from "vitest";

import ManualRoutes from "./fixtures/manual-routes.marko";

test("constructs the route graph from browser history during client rendering", async () => {
  window.history.replaceState(null, "", "/about");

  await render(ManualRoutes, {
    url: new URL("https://server.example/"),
  });

  expect(
    await screen.findByRole("heading", { name: "Root layout" }),
  ).toBeTruthy();
  expect(
    await screen.findByRole("heading", { name: "About page" }),
  ).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Home page" })).toBeNull();
});

test("navigates client-side while retaining standard link hrefs", async () => {
  window.history.replaceState(null, "", "/about");
  await render(ManualRoutes, {
    url: new URL("https://server.example/"),
  });

  const homeLink = await screen.findByRole("link", { name: "Home" });
  expect(homeLink.getAttribute("href")).toBe("/");

  await fireEvent.click(homeLink);

  expect(
    await screen.findByRole("heading", { name: "Home page" }),
  ).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "About page" })).toBeNull();
  expect(window.location.pathname).toBe("/");
});
