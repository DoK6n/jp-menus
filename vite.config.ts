import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? "/jp-menus/" : "/",
  build: {
    outDir: "solid-dist",
  },
  plugins: [solid(), tailwindcss()],
});
