import { createServer as createHttpServer } from "node:http";
import { fileURLToPath } from "node:url";

import { createServer as createViteServer } from "vite";

import { listBooks } from "./books-data.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
process.chdir(root);
const port = Number(process.env.PORT || 3000);
const vite = await createViteServer({
  root,
  appType: "custom",
  server: { middlewareMode: true },
});

const server = createHttpServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (url.pathname === "/api/books") {
    response.statusCode = 200;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.setHeader("cache-control", "no-store");
    return response.end(JSON.stringify(listBooks()));
  }

  vite.middlewares(request, response, async () => {
    try {
      const { default: RouterApp } = await vite.ssrLoadModule(
        "./src/router.server-entry.marko",
      );

      response.statusCode = 200;
      response.setHeader("content-type", "text/html; charset=utf-8");
      for await (const chunk of RouterApp.render({ $global: { url } })) {
        response.write(chunk);
      }
      response.end();
    } catch (error) {
      vite.ssrFixStacktrace(error);
      console.error(error);
      response.statusCode = 500;
      response.end("Internal Server Error");
    }
  });
});

server.listen(port, () => {
  console.log(`TanStack Router example: http://localhost:${port}`);
});
