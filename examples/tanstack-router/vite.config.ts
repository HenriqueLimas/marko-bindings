import marko from "@marko/vite";
import { defineConfig, type Plugin } from "vite";

const markoServerEntryQuery = (): Plugin => ({
  name: "marko-server-entry-query",
  enforce: "pre",
  resolveId(source, importer) {
    const suffix = "?marko-server-entry";
    if (!source.endsWith(suffix)) return;

    const template = source.slice(0, -suffix.length);
    const serverEntry = template.replace(/\.marko$/, ".server-entry.marko");
    return this.resolve(serverEntry, importer, { skipSelf: true });
  },
});

export default defineConfig({
  plugins: [markoServerEntryQuery(), marko()],
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
