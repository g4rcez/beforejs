import fs from "fs";
import path from "path";
import express, { Request, Response } from "express";
import chokidar from "chokidar";
import * as ViteJS from "vite";
import { parse } from "node-html-parser";

const root = process.cwd();

const write = (path: string, data: string) =>
  fs.writeFileSync(path, data, { encoding: "utf-8" });

async function createServer() {
  const vite = await ViteJS.createServer({
    root,
    logLevel: "error",
    clearScreen: false,
    server: {
      middlewareMode: "ssr",
      cors: true,
      watch: { usePolling: true, followSymlinks: false },
    },
  });

  const app = express().use(vite.middlewares);

  const route = async (file: string, htmlPath: string) => {
    const pathFile = path.resolve(path.join("src", file));
    let module = await vite.ssrLoadModule(pathFile);
    console.log(`${new Date().toISOString()} - Add ${file} in ${module.PATH}`);
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
            props.error = error;
          }
        }
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
        let html = template.replace(`<!--app-html-->`, module.render(props));
        if (typeof module.createHead === "function") {
          const head = parse(module.createHead(props));
          const htmlNode = parse(html);
          htmlNode.querySelector("head").appendChild(head);
          html = htmlNode.toString();
        }
        return res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.log(e.stack);
        res.status(500).end(e.stack);
      }
    });
  };

  const watcher = chokidar.watch("src/**/*.view.tsx", {
    persistent: true,
    cwd: root,
  });

  const execWatcher = async (name: string) => {
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
    const viewsFileHtml = path.resolve(path.join("views", `${basename}.html`));

    if (!fs.existsSync(viewsFileHtml)) {
      write(viewsFileHtml, templateModel);
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
