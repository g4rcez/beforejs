import express, { Request, Response, Router } from "express";
import fs from "fs";
import { glob } from "glob";
import { parse } from "node-html-parser";
import path from "path";
import { createElement, FC } from "react";
import { renderToString } from "react-dom/server";
import staticServer from "serve-static";

const Resolve = (p: string) => path.resolve(__dirname, p);

const root = process.cwd();

const createServer = async () => {
    const app = express();
    app.use(
        staticServer(Resolve(path.join(root, "dist", "client")), {
            index: false,
            etag: true,
            maxAge: 10800,
            lastModified: true,
            immutable: true,
        })
    );

    const mainModule = require(Resolve(path.join(root, "dist", "server", "pages", "_main.js"))).Main;
    console.log({ mainModule });

    const route = (file: string, htmlPath: string) => {
        const indexProd = fs.readFileSync(htmlPath, "utf-8");

        const module = require(path.join(root, "dist", "server", file));
        const Component: FC<any> = module.default;

        return {
            path: module.PATH,
            render: async (req: Request, res: Response) => {
                try {
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
                    const html = parse(indexProd);
                    const head = html.querySelector("head");
                    if (module.DynamicHead) {
                        head.appendChild(parse(renderToString(createElement(module.DynamicHead, props))));
                    }
                    const app = html.querySelector("#app");
                    head.appendChild(parse(`<script id="__SERVER_SIDE_PROPS__" type="application/ld+json">${JSON.stringify(props)}</script>`));
                    app.innerHTML = renderToString(createElement(mainModule, {}, createElement(Component, props)));

                    res.status(200).set({ "Content-Type": "text/html" }).send(html.toString());
                } catch (error) {
                    const e = error as any;
                    console.error(e.stack);
                    res.status(500).end(e.stack);
                }
            },
        };
    };

    const loadFrontendRoutes = () =>
        new Promise((res, rej) =>
            glob("dist/client/views/**/*.html", (error: Error | null, files: string[]) => {
                if (error) rej([]);
                return res(
                    files.map((x) => {
                        const config = route(`${path.basename(x, ".html")}.view`, x);
                        app.get(config.path, config.render);
                    })
                );
            })
        );
    const loadApiRoutes = () =>
        new Promise((res, rej) =>
            glob("dist/server/**/*.api.js", (error: Error | null, files: string[]) => {
                if (error) rej([]);
                const router = Router();
                res(
                    files.map((x) => {
                        const module = require(path.resolve(path.join(root, x))).default;
                        module.handlers.forEach((route: any) => (router as any)[route.method](module.path, route.handler));
                    })
                );
                app.use("/api", router);
            })
        );
    await loadFrontendRoutes();
    await loadApiRoutes();
    return Promise.resolve(app);
};

(async () => {
    const app = await createServer();
    const instance = app.listen(3000, () => console.log("Up in :3000"));
    process.on("SIGINT", () => instance.close());
})();
