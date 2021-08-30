import express, { Request, Response } from "express";
import fs from "fs";
import { glob } from "glob";
import path from "path";
import staticServer from "serve-static";
import { ApiBefore } from ".";

const createServer = async (basePath = ApiBefore.BASE_PATH) => {
    const staticMiddleware = staticServer(ApiBefore.resolve("dist", "client"), {
        etag: true,
        index: false,
        maxAge: 10800,
        immutable: true,
        lastModified: true,
    });

    const app = express().disable("x-powered-by");
    app.use(basePath, (req, res, next) => staticMiddleware(req, res, next));

    const mainModule = require(ApiBefore.resolve("dist", "server", "pages", "_main.js")).Main;

    const route = (file: string, htmlPath: string) => {
        const indexProd = fs.readFileSync(htmlPath, "utf-8");

        const module: ApiBefore.Module = require(ApiBefore.join("dist", "server", file));

        return {
            path: module.PATH,
            render: async (req: Request, res: Response) => {
                try {
                    const props = await ApiBefore.createComponentProps(req, module);
                    const html = await ApiBefore.render(indexProd, mainModule, module, props);
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
                              app.get(ApiBefore.urls(basePath, config.path), config.render);
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
                              const module: ApiBefore.ApiHandler = require(ApiBefore.resolve(file)).default;
                              ApiBefore.createApiRouter(module, app, basePath);
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
