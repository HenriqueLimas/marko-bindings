/** @vitest-environment node */

import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import marko from "@marko/vite";
import { afterEach, expect, test } from "vitest";
import { createServer, resolveConfig, type ViteDevServer } from "vite";

import { tanstackRouter } from "@marko-bindings/tanstack-router/vite";

const roots: string[] = [];
const servers: ViteDevServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

test("generates a route tree with lazy Marko component pieces", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "marko-router-vite-"));
  roots.push(root);
  const routesDirectory = path.join(root, "src/routes");
  await mkdir(routesDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(routesDirectory, "__root.ts"),
      `import { createRootRoute } from "@marko-bindings/tanstack-router"\nexport const Route = createRootRoute()\n`,
    ),
    writeFile(path.join(routesDirectory, "__root.component.marko"), "<main/>"),
    writeFile(
      path.join(routesDirectory, "about.ts"),
      `import { createFileRoute } from "@marko-bindings/tanstack-router"\nexport const Route = createFileRoute("/about")({})\n`,
    ),
    writeFile(
      path.join(routesDirectory, "about.component.marko"),
      "<h1>About</h1>",
    ),
    writeFile(
      path.join(routesDirectory, "about.errorComponent.marko"),
      "<h1>Error</h1>",
    ),
    writeFile(
      path.join(routesDirectory, "contact.component.marko"),
      "<h1>Contact</h1>",
    ),
  ]);

  await resolveConfig(
    {
      root,
      logLevel: "silent",
      plugins: [tanstackRouter()],
    },
    "serve",
  );

  const [generated, generatedComponents] = await Promise.all([
    readFile(path.join(root, "src/routeTree.gen.ts"), "utf8"),
    readFile(path.join(root, "src/routeTree.gen.marko"), "utf8"),
  ]);

  expect(generated).toContain(
    `import { Route as rootRouteImport } from './routes/__root'`,
  );
  expect(generated).toContain(
    `import { Route as AboutRouteImport } from './routes/about'`,
  );
  expect(generated).toContain("component: lazyRouteComponent(");
  expect(generated).toContain("import('./routes/about.component.marko')");
  expect(generated).toContain("getAboutRouteComponent()");
  expect(generated).toContain("errorComponent: lazyRouteComponent(");
  expect(generated).toContain("getAboutRouteErrorComponent()");
  expect(generatedComponents).toContain(
    `import AboutRouteComponent from './routes/about.component.marko' with { load: 'render' }`,
  );
  expect(generatedComponents).toContain(
    `import AboutRouteErrorComponent from './routes/about.errorComponent.marko' with { load: 'render' }`,
  );
  expect(generated).toContain(
    `const ContactRouteImport = createFileRoute('/contact')()`,
  );
  expect(generated).toContain("import('./routes/contact.component.marko')");
  expect(generated).toContain("export const routeTree =");
});

test("loads the generated route tree through Vite", async () => {
  const packageDirectory = path.resolve(import.meta.dirname, "..");
  const root = await mkdtemp(path.join(packageDirectory, ".vite-route-test-"));
  roots.push(root);
  const routesDirectory = path.join(root, "src/routes");
  await mkdir(routesDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(routesDirectory, "__root.ts"),
      `import { createRootRoute } from "@marko-bindings/tanstack-router"\nexport const Route = createRootRoute()\n`,
    ),
    writeFile(path.join(routesDirectory, "__root.component.marko"), "<main/>"),
    writeFile(
      path.join(routesDirectory, "about.ts"),
      `import { createFileRoute } from "@marko-bindings/tanstack-router"\nexport const Route = createFileRoute("/about")({})\n`,
    ),
    writeFile(
      path.join(routesDirectory, "about.component.marko"),
      "<h1>About</h1>",
    ),
    writeFile(
      path.join(routesDirectory, "posts.ts"),
      `import { createFileRoute } from "@marko-bindings/tanstack-router"\nexport const Route = createFileRoute("/posts")({})\n`,
    ),
    writeFile(
      path.join(routesDirectory, "posts.index.component.marko"),
      "<h1>Posts</h1>",
    ),
    writeFile(
      path.join(routesDirectory, "posts.$postId.component.marko"),
      "<h1>Post</h1>",
    ),
  ]);

  const server = await createServer({
    root,
    logLevel: "silent",
    server: { middlewareMode: true },
    plugins: [tanstackRouter(), marko()],
  });
  servers.push(server);

  const { routeTree } = await server.ssrLoadModule("/src/routeTree.gen.ts");

  expect(routeTree.children).toHaveLength(2);
  expect(routeTree.options.component.preload).toBeTypeOf("function");

  const aboutRoute = routeTree.children.find(
    (route: { options: { path: string } }) => route.options.path === "/about",
  );
  const postsRoute = routeTree.children.find(
    (route: { options: { path: string } }) => route.options.path === "/posts",
  );
  expect(aboutRoute.options.component.preload).toBeTypeOf("function");
  expect(postsRoute.children).toHaveLength(2);
  expect(
    postsRoute.children
      .map((route: { options: { path: string } }) => route.options.path)
      .sort(),
  ).toEqual(["/$postId", "/"].sort());
});
