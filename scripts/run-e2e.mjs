import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const serverScript = fileURLToPath(new URL("serve-dist.mjs", import.meta.url));
const playwrightCli = fileURLToPath(
  new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
);

const server = spawn(process.execPath, [serverScript], {
  cwd: projectRoot,
  stdio: ["ignore", "pipe", "inherit"],
});

const ready = new Promise((resolve, reject) => {
  server.once("error", reject);
  server.stdout.setEncoding("utf8");
  server.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    if (chunk.includes("Serving SolidJS build")) resolve();
  });
});

try {
  await Promise.race([
    ready,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timed out starting the test server")), 10_000),
    ),
  ]);

  const runner = spawn(process.execPath, [playwrightCli, "test"], {
    cwd: projectRoot,
    stdio: "inherit",
  });
  const [exitCode] = await once(runner, "exit");
  process.exitCode = typeof exitCode === "number" ? exitCode : 1;
} finally {
  server.kill();
}
