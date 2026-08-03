import marko from "@marko/vite";
import { tanstackRouter } from "@marko-bindings/tanstack-router/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tanstackRouter(), marko()],
  builder: {},
  environments: {
    ssr: {
      build: {
        ssr: true,
        outDir: "dist/server",
        rolldownOptions: {
          input: "src/router.server-entry.marko",
        },
      },
    },
    client: {
      build: {
        outDir: "dist/client",
      },
    },
  },
});
