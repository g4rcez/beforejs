import fs from "fs";
import path from "path";
import express, { Request, Response } from "express";
import chokidar from "chokidar";
import * as ViteJS from "vite";

const root = process.cwd();

async function createServer() {
  const app = express();

  const vite = await ViteJS.createServer({
    root,
    logLevel: "error",
    server: {
      middlewareMode: "ssr",
      cors: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  });
  app.use(vite.middlewares);

  const route = async (file: string, htmlPath: string) => {
    const pathFile = path.resolve(path.join("src", file));
    const module = await vite.ssrLoadModule(pathFile);
    console.log(`${new Date().toISOString()} - Add ${file} in ${module.PATH}`);
    app.get(module.PATH, async (req: Request, res: Response) => {
      try {
        const props = {
          url: req.originalUrl,
          host: req.hostname,
          params: req.params,
          query: req.query,
        };
        const template = await vite.transformIndexHtml(
          req.originalUrl,
          fs
            .readFileSync(path.resolve(htmlPath), "utf-8")
            .replace(
              '<script id="__SERVER_SIDE_PROPS__"></script>',
              `<script id="__SERVER_SIDE_PROPS__">window.__SERVER_SIDE_PROPS__=${JSON.stringify(
                props
              )}</script>`
            )
        );
        res
          .status(200)
          .set({ "Content-Type": "text/html" })
          .send(template.replace(`<!--app-html-->`, module.render(props)));
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.log(e.stack);
        res.status(500).end(e.stack);
      }
    });
  };

  const watcher = chokidar.watch("src/**/*.view.tsx", {
    persistent: true,
  });

  const execWatcher = async (name: string) => {
    const clientFile = name.replace(/\.view\.tsx/, ".client.tsx");
    const templateModel = fs
      .readFileSync(path.resolve("template.html"), "utf-8")
      .replace(/{{\smodule\s}}/g, `/${clientFile}`);
    const basename = path.basename(name, ".view.tsx");
    const clientTsx = path.resolve(clientFile);
    if (!fs.existsSync(clientTsx)) {
      fs.writeFileSync(
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
    const viewsFileHtml = path.resolve(path.join("views", `${basename}.html`));

    if (!fs.existsSync(viewsFileHtml)) {
      fs.writeFileSync(viewsFileHtml, templateModel, { encoding: "utf-8" });
    }

    await route(filePath, viewsFileHtml);
  };

  watcher.on("add", execWatcher);
  watcher.on("change", execWatcher);

  return { app, vite };
}

(async () => {
  const server = await createServer();
  server.app.listen(3000, () => console.log("Running :3000"));
})();
