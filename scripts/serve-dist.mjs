import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../solid-dist/", import.meta.url);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
};

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const relativePath = requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.slice(1);
    const fileUrl = new URL(relativePath, root);
    if (!fileUrl.href.startsWith(root.href)) throw new Error("invalid path");

    const body = await readFile(fileUrl);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(fileURLToPath(fileUrl))] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(4173, "127.0.0.1", () => {
  console.log("Serving SolidJS build at http://127.0.0.1:4173");
});
