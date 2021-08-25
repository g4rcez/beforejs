import express, { Request, Response } from "express";
import fs from "fs";
import { glob } from "glob";
import { parse } from "node-html-parser";
import path from "path";
import { createElement, FC } from "react";
import { renderToString } from "react-dom/server";
import staticServer from "serve-static";

const Resolve = (p: string) => path.resolve(__dirname, p);

const createServer = async () => {
    const app = express();
    app.use(
        staticServer(Resolve(path.join(process.cwd(), "dist", "client")), {
            index: false,
            etag: true,
            maxAge: 10800,
            lastModified: true,
            immutable: true,
        })
    );

    const route = (file: string, htmlPath: string) => {
        const indexProd = fs.readFileSync(htmlPath, "utf-8");

        const module = require(path.join(
            process.cwd(),
            "dist",
            "server",
            file
        ));
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
                    const html = parse(indexProd);
                    const head = html.querySelector("head");
                    if (typeof module.createHead === "function") {
                        head.appendChild(parse(module.createHead(props)));
                    }
                    const app = html.querySelector("#app");
                    head.appendChild(
                        parse(
                            `<script id="__SERVER_SIDE_PROPS__">window.__SERVER_SIDE_PROPS__=${JSON.stringify(
                                props
                            )}</script>`
                        )
                    );
                    app.innerHTML = renderToString(
                        createElement(Component, props)
                    );

                    res.status(200)
                        .set({ "Content-Type": "text/html" })
                        .send(html.toString());
                } catch (e) {
                    console.error(e.stack);
                    res.status(500).end(e.stack);
                }
            },
        };
    };

    const loadFrontendRoutes = () =>
        new Promise((res, rej) => {
            glob(
                "dist/client/views/**/*.html",
                (error: Error | null, files: string[]) => {
                    if (error) rej([]);
                    return res(
                        files.map((x) => {
                            const basename = path.basename(x, ".html");
                            const config = route(`${basename}.view`, x);
                            app.get(config.path, config.render);
                        })
                    );
                }
            );
        });

    await loadFrontendRoutes();
    return Promise.resolve(app);
};

(async () => {
    const app = await createServer();
    const instance = app.listen(3000, () => console.log("Up in :3000"));
    process.on("SIGINT", () => {
        instance.close();
    });
})();
