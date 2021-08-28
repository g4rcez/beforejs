import chokidar from "chokidar";
import express, { Request, Response, Router } from "express";
import fs from "fs";
import { parse } from "node-html-parser";
import path from "path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import * as ViteJS from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";

const root = process.cwd();

const write = (path: string, data: string) => fs.writeFileSync(path, data, { encoding: "utf-8" });

const replaceViewToClient = (name: string) => name.replace(/\.view\.tsx$/, ".client.tsx");

async function createServer() {
    const vite = await ViteJS.createServer({
        root,
        logLevel: "info",
        clearScreen: false,
        plugins: [],
        server: {
            fs: { strict: false },
            middlewareMode: "ssr",
            cors: true,
            watch: { usePolling: true, followSymlinks: true, persistent: true },
        },
    });

    const app = express().use(vite.middlewares);

    const route = async (file: string, htmlPath: string, cachePath: string) => {
        const pathFile = path.resolve(path.join("src", file));
        let module = await vite.ssrLoadModule(pathFile);
        console.log(`${new Date().toISOString()} - Add ${file} in ${module.PATH}`);
        app.get(module.PATH, async (req: Request, res: Response) => {
            try {
                const MainModule = (await vite.ssrLoadModule(path.resolve(path.join(process.cwd(), "src", "_main.tsx")))).default;
                module = await vite.ssrLoadModule(pathFile);
                const props = {
                    path: req.path,
                    url: req.originalUrl,
                    host: req.hostname,
                    params: req.params,
                    query: req.query,
                    prefetch: null,
                    error: null as any,
                };
                if (module.prefetch) {
                    try {
                        const response = await module.prefetch(props);
                        props.prefetch = response.props;
                    } catch (error) {
                        console.error(error);
                        props.error = error;
                    }
                }

                const html = fs.readFileSync(path.resolve(path.join(path.join("template.html"))), "utf-8");

                const Dom = parse(html);
                const Body = Dom.querySelector("body");
                console.log({ htmlPath, cachePath });
                Body.appendChild(parse(`<script type="module" src="/${cachePath}"></script>`));
                const DomHeader = Dom.querySelector("head");
                DomHeader.appendChild(parse(`<script id="__SERVER_SIDE_PROPS__" type="application/ld+json">${JSON.stringify(props)}</script>`));
                if (module.DynamicHead) {
                    DomHeader.appendChild(parse(renderToString(createElement(module.DynamicHead, props))));
                }

                const Root = Dom.querySelector("#app");
                Root.innerHTML = renderToString(createElement(MainModule, {}, createElement(module.default, props)));

                return res
                    .status(200)
                    .set({ "Content-Type": "text/html" })
                    .send(await vite.transformIndexHtml(req.originalUrl, Dom.toString()));
            } catch (e) {
                const error = e as any;
                vite.ssrFixStacktrace(error);
                console.error(error.stack);
                res.status(500).end(error.stack);
            }
        });
    };

    const frontendWatcher = chokidar.watch("src/**/*.view.tsx", {
        persistent: true,
        cwd: root,
    });

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

        const filePath = name.replace(/^src\//, "");

        await route(filePath, name, cachePath);
    };

    frontendWatcher.on("add", frontendExec);
    frontendWatcher.on("change", frontendExec);

    const ApiWatcher = chokidar.watch("src/**/*.api.ts", {
        persistent: true,
        interval: 3000,
        cwd: root,
    });

    const apiExec = async (name: string) => {
        const config: any = require(path.resolve(path.join(root, name))).default;
        const apiRoutes = Router();
        config.handlers.map((route: any) => (apiRoutes as any)[route.method](config.path, route.handler));
        app.use("/api", apiRoutes);
    };

    ApiWatcher.on("add", apiExec);
    ApiWatcher.on("change", apiExec);

    return { app, vite };
}

(async () => {
    const server = await createServer();
    server.app.listen(3000, () => console.log("Running :3000"));
})();
