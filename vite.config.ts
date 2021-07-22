import { join, basename, resolve } from "path";
import fs from "fs";
import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig({
  plugins: [reactRefresh()],
  json: { stringify: true },
  server: {
    fs: {
      strict: true,
    },
  },
  build: {
    minify: "terser",
    assetsInlineLimit: 0,
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        test: resolve(__dirname, "test/index.html"),
      },
      output: {
        assetFileNames: "assets/[name][extname]",
        entryFileNames: (a) => (a.name.endsWith(".js") ? a.name : "[name].js"),
        chunkFileNames: (a) => (a.name.endsWith(".js") ? a.name : "[name].js"),
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const [, module] = /node_modules\/(@?[a-z0-9-]+?[a-z0-9-]+)/.exec(
              id
            );
            const path = join(
              process.cwd(),
              "node_modules",
              module,
              "package.json"
            );
            if (fs.existsSync(path)) {
              try {
                const packageJson = JSON.parse(
                  fs.readFileSync(path, {
                    encoding: "utf-8",
                  })
                );
                const version = packageJson.version;
                return `@vendor/${module}_${version}.js`;
              } catch (error) {
                console.log(error);
              }
            }
          }
          if (id.endsWith("page.tsx")) {
            return `pages/${basename(id.toLowerCase()).replace(/\.tsx/, "")}`;
          }
        },
      },
    },
  },
});
