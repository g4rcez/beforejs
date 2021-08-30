import chokidar from "chokidar";
import express, { Request, Response } from "express";
import fs from "fs";
import { parse } from "node-html-parser";
import path from "path";
import * as ViteJS from "vite";
import { Before } from ".";

const root = process.cwd();

const write = (path: string, data: string) => fs.writeFileSync(path, data, { encoding: "utf-8" });

async function createServer() {
    const vite = await ViteJS.createServer({
        root,
        plugins: [],
        logLevel: "info",
        clearScreen: false,
        server: {
            cors: true,
            fs: { strict: true },
            middlewareMode: "ssr",
            watch: { usePolling: true, followSymlinks: true, persistent: true },
        },
    });

    const app = express();

    app.use(vite.middlewares).use((req, _, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });

    const route = async (file: string, cachePath: string) => {
        try {
            const pathFile = path.resolve(path.join("src", file));
            let module: Before.Module = (await vite.ssrLoadModule(pathFile)) as never;
            console.log(`${new Date().toISOString()} - Add ${file} in ${module.PATH}`);

            app.get(module.PATH, async (req: Request, res: Response) => {
                try {
                    const MainModule = (await vite.ssrLoadModule(Before.resolve("src", "_main.tsx"))).default;
                    module = (await vite.ssrLoadModule(pathFile)) as never;

                    const props = await Before.createComponentProps(req, module);

                    const html = fs.readFileSync(Before.resolve("template.html"), "utf-8");
                    const Dom = parse(html);
                    const Body = Dom.querySelector("body");
                    Body.appendChild(parse(`<script type="module" src="/${cachePath}"></script>`));

                    const pageRendered = await Before.render(Dom.toString(), MainModule, module, props);
                    return res
                        .status(200)
                        .set({ "Content-Type": "text/html" })
                        .send(await vite.transformIndexHtml(req.originalUrl, pageRendered));
                } catch (e) {
                    const error = e as any;
                    vite.ssrFixStacktrace(error);
                    console.error(error.stack);
                    res.status(500).end(error.stack);
                }
            });
        } catch (error) {
            vite.ssrFixStacktrace(error as any);
            console.error((error as any).stack);
        }
    };

    const frontendWatcher = chokidar.watch(path.join("src", "**", "*.view.tsx"), { persistent: true, cwd: root });

    const frontendExec = async (name: string) => {
        const basename = path.basename(name, ".view.tsx");
        const cachePath = path.join(".cache", "pages", `${basename}.client.tsx`);
        const mainModulePath = Before.resolve("src", "_main.tsx");
        if (fs.existsSync(mainModulePath)) {
            write(
                cachePath,
                `import ReactDOM from "react-dom";
import React from "react";
import App from "../../${name}";
import Main from "../../src/_main";

ReactDOM.hydrate(
    <Main>
        <App {...JSON.parse((window as any).__SERVER_SIDE_PROPS__.innerText)} />
    </Main>,
    document.getElementById("app")
);`
            );
        } else {
            write(
                cachePath,
                `import ReactDOM from "react-dom";
import React from "react";
import App from "../../${name}";

ReactDOM.hydrate(
    <App {...JSON.parse((window as any).__SERVER_SIDE_PROPS__.innerText)} />,
    document.getElementById("app")
);`
            );
        }
        await route(name.replace(/^src\//, ""), cachePath);
    };

    frontendWatcher.on("add", frontendExec);
    frontendWatcher.on("change", frontendExec);

    const ApiWatcher = chokidar.watch(path.join("src", "**", "*.api.ts"), { persistent: true, interval: 3000, cwd: root });

    const apiExec = async (name: string) => {
        const config: Before.ApiHandler = require(Before.resolve(name)).default;
        Before.createApiRouter(config, app);
    };

    ApiWatcher.on("add", apiExec);
    ApiWatcher.on("change", apiExec);

    return app;
}

(async () => {
    const server = await createServer();
    const port = 3000;
    const controller = server.listen(port, () => console.log(`Running :${port}`));
    process.on("unhandledRejection", () => controller.close()).on("uncaughtException", (err) => controller.close());
})();
