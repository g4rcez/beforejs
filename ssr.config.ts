import fs from "fs";
import path from "path";
import { build } from "vite";
import { getSsrFiles, root } from "./scripts/get-input-files";
import { init } from "./scripts/pre-init";

(async () => {
    // await init()
    await build({
        plugins: [],
        server: {
            fs: {
                strict: true,
                allow: [],
            },
            cors: false,
            force: true,
        },
        resolve: {
            alias: {
                "@api": "src/api",
                "@components": "src/components",
                "@pages": "src/pages",
            },
        },
        optimizeDeps: {
            esbuildOptions: {
                keepNames: true,
            },
        },
        build: {
            ssrManifest: false,
            outDir: "dist/server",
            ssr: true,
            minify: false,
            manifest: false,
            commonjsOptions: {
                sourceMap: false,
                requireReturnsDefault: false,
            },
            terserOptions: {
                compress: false,
                ecma: 2020,
                keep_fnames: true,
            },
            rollupOptions: {
                input: await getSsrFiles(),
            },
        },
    });
    const options = { force: true, recursive: true };
    fs.rmSync(path.resolve(path.join(root, "dist/server/views")), options);
    const target = path.join("dist", "client", "views");
    const oldFolder = path.join("dist", "client", ".cache", "pages");
    fs.mkdirSync(target);
    fs.renameSync(oldFolder, target);
    fs.rmSync(path.join("dist", "client", ".cache"), options);
})();
