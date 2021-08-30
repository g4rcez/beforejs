import fs from "fs";
import { basename, join } from "path";
import { defineConfig } from "vite";
import { getHtmlFiles } from "./scripts/get-input-files";

export default async () => {
    const inputs = await getHtmlFiles();
    return defineConfig({
        clearScreen: false,
        resolve: {
            alias: {
                "@api": "src/api",
                "@components": "src/components",
                "@pages": "src/pages",
            },
        },
        mode: process.env.NODE_ENV ?? "development",
        plugins: [],
        build: {
            outDir: "dist/client",
            manifest: false,
            commonjsOptions: {
                sourceMap: false,
            },
            ssrManifest: false,
            cssCodeSplit: false,
            sourcemap: false,
            rollupOptions: {
                input: inputs,
                output: {
                    assetFileNames: "assets/[name][extname]",
                    entryFileNames: (a) => (a.name.endsWith(".js") ? a.name : "[name].js"),
                    chunkFileNames: (a) => (a.name.endsWith(".js") ? a.name : "[name].js"),
                    preferConst: true,
                    sourcemap: false,
                    strict: true,
                    manualChunks(id) {
                        if (id.endsWith("src/_main.tsx")) {
                            return `pages/_main`;
                        }
                        if (id.endsWith("client.tsx") || id.endsWith("view.tsx")) return `pages/${basename(id.toLowerCase()).replace(/\.tsx/, "")}`;
                        if (id.includes("node_modules")) {
                            const module = /node_modules\/(@?[a-z0-9-]+?[a-z0-9-]+)/.exec(id)?.[1]!;
                            const path = join(process.cwd(), "node_modules", module, "package.json");
                            if (fs.existsSync(path)) {
                                try {
                                    const packageJson = JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));
                                    const version = packageJson.version;
                                    return `@vendor/${module}_${version}.js`;
                                } catch (error) {
                                    console.log(error);
                                }
                            }
                        }
                    },
                },
            },
        },
    });
};
