import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/jp-menus/" : "/",
  build: {
    outDir: "solid-dist",
  },
  plugins: [solid(), tailwindcss()],
}));
