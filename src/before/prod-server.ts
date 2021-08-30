import express, { Request, Response } from "express";
import fs from "fs";
import { glob } from "glob";
import path from "path";
import staticServer from "serve-static";
import { Before } from ".";

const createServer = async (basePath = Before.BASE_PATH) => {
    const staticMiddleware = staticServer(Before.resolve("dist", "client"), {
        etag: true,
        index: false,
        maxAge: 10800,
        immutable: true,
        lastModified: true,
    });

    const app = express().disable("x-powered-by");
    app.use(basePath, (req, res, next) => staticMiddleware(req, res, next));

    const mainModule = require(Before.resolve("dist", "server", "pages", "_main.js")).Main;

    const route = (file: string, htmlPath: string) => {
        const indexProd = fs.readFileSync(htmlPath, "utf-8");

        const module: Before.Module = require(Before.join("dist", "server", file));

        return {
            path: module.PATH,
            render: async (req: Request, res: Response) => {
                try {
                    const props = await Before.createComponentProps(req, module);
                    const html = await Before.render(indexProd, mainModule, module, props);
                    return res.status(200).set({ "Content-Type": "text/html" }).send(html.toString());
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
            glob(path.join("dist", "client", "views", "**", "*.html"), (error, files) =>
                error
                    ? rej([])
                    : res(
                          files.forEach((file) => {
                              const config = route(`${path.basename(file, ".html")}.view`, file);
                              console.log({ path: config.path });
                              app.get(Before.urls(basePath, config.path), config.render);
                          })
                      )
            )
        );

    const loadApiRoutes = () =>
        new Promise((res, rej) =>
            glob(path.join("dist", "server", "**", "*.api.js"), (error, files) =>
                error
                    ? rej([])
                    : res(
                          files.map((file) => {
                              const module: Before.ApiHandler = require(Before.resolve(file)).default;
                              Before.createApiRouter(module, app, basePath);
                          })
                      )
            )
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
