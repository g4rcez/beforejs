import express, { Request, Response, Router } from "express";
import fs from "fs";
import { glob } from "glob";
import path from "path";
import staticServer from "serve-static";
import { Before } from "./before";

const createServer = async () => {
    const app = express();
    app.disable("x-powered-by");

    app.use(
        staticServer(Before.resolve("dist", "client"), {
            index: false,
            etag: true,
            maxAge: 10800,
            lastModified: true,
            immutable: true,
        })
    );

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
            glob(path.join("dist", "client", "views", "**", "*.html"), (error: Error | null, files: string[]) =>
                error
                    ? rej([])
                    : res(
                          files.forEach((file) => {
                              const config = route(`${path.basename(file, ".html")}.view`, file);
                              app.get(config.path, config.render);
                          })
                      )
            )
        );

    const loadApiRoutes = () =>
        new Promise((res, rej) =>
            glob(path.join("dist", "server", "**", "*.api.js"), (error: Error | null, files: string[]) => {
                if (error) rej([]);
                const router = Router();
                res(
                    files.map((file) => {
                        const module: Before.ApiHandler = require(Before.resolve(file)).default;
                        module.handlers.forEach((route) => router[route.method](module.path, route.handler));
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
