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
    Fs.rmSync(path.resolve(path.join(root, "dist/server/views")), {
        force: true,
        recursive: true,
    });
})();
