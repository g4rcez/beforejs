import chokidar from "chokidar";
import express, { Request, Response, Router } from "express";
import fs from "fs";
import { parse } from "node-html-parser";
import path from "path";
import * as ViteJS from "vite";
import { Before } from "./before";

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
            fs: { strict: false },
            middlewareMode: "ssr",
            watch: { usePolling: true, followSymlinks: true, persistent: true },
        },
    });

    const app = express().use(vite.middlewares);

    const route = async (file: string, cachePath: string) => {
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
    };

    const frontendWatcher = chokidar.watch(path.join("src", "**", "*.view.tsx"), { persistent: true, cwd: root });

    const frontendExec = async (name: string) => {
        const basename = path.basename(name, ".view.tsx");
        const cachePath = path.join(".cache", "pages", `${basename}.client.tsx`);
        if (!fs.existsSync(cachePath)) {
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
        }
        await route(name.replace(/^src\//, ""), cachePath);
    };

    frontendWatcher.on("add", frontendExec);
    frontendWatcher.on("change", frontendExec);

    const ApiWatcher = chokidar.watch(path.join("src", "**", "*.api.ts"), { persistent: true, interval: 3000, cwd: root });

    const apiExec = async (name: string) => {
        const config: Before.ApiHandler = require(Before.resolve(name)).default;
        const apiRoutes = Router();
        config.handlers.map((route) => apiRoutes[route.method](config.path, route.handler));
        app.use("/api", apiRoutes);
    };

    ApiWatcher.on("add", apiExec);
    ApiWatcher.on("change", apiExec);

    return app;
}

(async () => {
    const server = await createServer();
    server.listen(3000, () => console.log("Running :3000"));
})();
