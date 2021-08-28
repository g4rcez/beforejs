import Fs from "fs";
import path from "path";
import { build } from "vite";
import { getSsrFiles, root } from "./scripts/get-input-files";

(async () => {
    await build({
        plugins: [],
        json: { stringify: true },
        server: {
            fs: {
                strict: true,
            },
            cors: false,
            force: true,
        },
        build: {
            ssrManifest: false,
            outDir: "dist/server",
            ssr: true,
            minify: false,
            assetsInlineLimit: 0,
            manifest: true,
            rollupOptions: {
                input: await getSsrFiles(),
            },
        },
    });
    const options = { force: true, recursive: true };
    Fs.rmSync(path.resolve(path.join(root, "dist/server/views")), options);
    const target = path.join("dist", "client", "views");
    const oldFolder = path.join("dist", "client", ".cache", "pages");
    Fs.mkdirSync(target);
    Fs.renameSync(oldFolder, target);
    Fs.rmSync(path.join("dist", "client", ".cache"), options);
})();
