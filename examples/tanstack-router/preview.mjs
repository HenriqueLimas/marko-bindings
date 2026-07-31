import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { listBooks } from "./books-data.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const clientRoot = resolve(root, "dist/client");
const port = Number(process.env.PORT || 4173);
const { default: RouterApp } =
  await import("./dist/server/router.server-entry.js");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const findClientAsset = async (pathname) => {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return;
  }

  const file = resolve(clientRoot, `.${decodedPath}`);
  if (file !== clientRoot && !file.startsWith(`${clientRoot}${sep}`)) return;

  try {
    const info = await stat(file);
    if (info.isFile()) return { file, size: info.size };
  } catch {
    // Missing client files fall through to the router document.
  }
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    if (url.pathname === "/api/books") {
      response.statusCode = 200;
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.setHeader("cache-control", "no-store");
      return response.end(JSON.stringify(listBooks()));
    }

    const asset = await findClientAsset(url.pathname);
    if (asset) {
      response.statusCode = 200;
      response.setHeader(
        "content-type",
        contentTypes[extname(asset.file)] || "application/octet-stream",
      );
      response.setHeader("content-length", asset.size);
      response.setHeader(
        "cache-control",
        "public, max-age=31536000, immutable",
      );
      if (request.method === "HEAD") return response.end();
      return createReadStream(asset.file).pipe(response);
    }

    response.statusCode = 200;
    response.setHeader("content-type", "text/html; charset=utf-8");
    for await (const chunk of RouterApp.render({ $global: { url } })) {
      response.write(chunk);
    }
    response.end();
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`TanStack Router production preview: http://localhost:${port}`);
});
