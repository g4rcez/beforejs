import fs from "fs";
import path from "path";
import express, { Request, Response, Router } from "express";
import chokidar from "chokidar";
import * as ViteJS from "vite";
import { renderToString } from "react-dom/server";
import { parse } from "node-html-parser";
import { createElement } from "react";

export type UrlParams<T extends string> = string extends T
    ? Record<string, string>
    : T extends `${infer Start}:${infer Param}/${infer Rest}`
    ? { [k in Param | keyof UrlParams<Rest>]: string }
    : T extends `${infer Start}:${infer Param}`
    ? { [k in Param]: string }
    : {};

const root = process.cwd();

const write = (path: string, data: string) =>
    fs.writeFileSync(path, data, { encoding: "utf-8" });

export const register = <Path extends string>(
    path: Path,
    method: Array<"get" | "post" | "put" | "delete" | "patch">,
    handler: (req: Request<UrlParams<Path>>, res: Response) => any
) => {
    return { path, method, handler };
};

type EndpointRegister = ReturnType<typeof register>;

async function createServer() {
    const vite = await ViteJS.createServer({
        root,
        logLevel: "info",
        clearScreen: true,
        server: {
            middlewareMode: "ssr",
            cors: true,
            watch: { usePolling: true, followSymlinks: true, persistent: true },
        },
    });

    const app = express().use(vite.middlewares);

    const route = async (file: string, htmlPath: string) => {
        const pathFile = path.resolve(path.join("src", file));
        let module = await vite.ssrLoadModule(pathFile);
        console.log(
            `${new Date().toISOString()} - Add ${file} in ${module.PATH}`
        );
        app.get(module.PATH, async (req: Request, res: Response) => {
            try {
                module = await vite.ssrLoadModule(pathFile);
                const props = {
                    path: req.path,
                    url: req.originalUrl,
                    host: req.hostname,
                    params: req.params,
                    query: req.query,
                    prefetch: null,
                    error: undefined,
                };
                if (typeof module.prefetch === "function") {
                    try {
                        const response = await module.prefetch(props);
                        props.prefetch = response;
                    } catch (error) {
                        console.error(error);
                        props.error = error;
                    }
                }

                const htmlTemplate = fs.readFileSync(
                    path.resolve(htmlPath),
                    "utf-8"
                );

                const Dom = parse(htmlTemplate);
                const DomHeader = Dom.querySelector("head");
                DomHeader.appendChild(
                    parse(
                        `<script id="__SERVER_SIDE_PROPS__">window.__SERVER_SIDE_PROPS__=${JSON.stringify(
                            props
                        )}</script>`
                    )
                );
                DomHeader.appendChild(
                    parse(
                        `<script>window.__SERVER_MODULE__=${module.default}</script>`
                    )
                );
                const Root = Dom.querySelector("#app");
                Root.innerHTML = renderToString(
                    createElement(module.default, props)
                );

                if (typeof module.createHead === "function") {
                    DomHeader.appendChild(parse(module.createHead(props)));
                }

                const html = await vite.transformIndexHtml(
                    req.originalUrl,
                    Dom.toString()
                );

                return res
                    .status(200)
                    .set({ "Content-Type": "text/html" })
                    .send(html);
            } catch (e) {
                vite.ssrFixStacktrace(e);
                console.log(e.stack);
                res.status(500).end(e.stack);
            }
        });
    };

    const frontendWatcher = chokidar.watch("src/**/*.view.tsx", {
        persistent: true,
        cwd: root,
    });

    const frontendExec = async (name: string) => {
        const clientFile = name.replace(/\.view\.tsx/, ".client.tsx");
        const templateModel = fs
            .readFileSync(path.resolve("template.html"), "utf-8")
            .replace(/{{\smodule\s}}/g, `/${clientFile}`);
        const basename = path.basename(name, ".view.tsx");
        const clientTsx = path.resolve(clientFile);
        if (!fs.existsSync(clientTsx)) {
            write(
                clientTsx,
                `import ReactDOM from "react-dom";
  import App from "./${basename}.view";
  import React from "react";
  ReactDOM.hydrate(
    <App {...window.__SERVER_SIDE_PROPS__} />,
    document.getElementById("app")
  );`
            );
        }

        const filePath = name.replace(/^src\//, "");
        const viewsFileHtml = path.resolve(
            path.join("views", `${basename}.html`)
        );

        if (!fs.existsSync(viewsFileHtml)) {
            write(viewsFileHtml, templateModel);
        }

        await route(filePath, viewsFileHtml);
    };

    frontendWatcher.on("add", frontendExec);
    frontendWatcher.on("change", frontendExec);

    const ApiWatcher = chokidar.watch("src/**/*.api.ts", {
        persistent: true,
        interval: 3000,
        cwd: root,
    });

    const apiExec = async (name: string) => {
        const config: EndpointRegister = require(path.resolve(
            path.join(root, name)
        )).default;
        const apiRoutes = Router();
        config.method.forEach((method) => {
            apiRoutes[method](config.path, config.handler);
        });
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
