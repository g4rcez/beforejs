// @ts-check
const fs = require("fs");
const path = require("path");
const express = require("express");

const isTest = process.env.NODE_ENV === "test" || !!process.env.VITE_TEST_BUILD;

async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production"
) {
  const resolve = (p) => path.resolve(__dirname, p);

  const app = express();

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;
  vite = await require("vite").createServer({
    root,
    logLevel: isTest ? "error" : "info",
    server: {
      middlewareMode: "ssr",
      cors: true,
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  });
  // use vite's connect instance as middleware
  app.use(vite.middlewares);

  const route = (file, htmlPath) => async (req, res) => {
    try {
      const url = req.originalUrl;
      const pathFile = path.resolve(path.join("src", file)) + ".tsx";

      const context = {};

      const props = { url, context, host: req.hostname };

      // always read fresh template in dev
      let template = fs
        .readFileSync(resolve(htmlPath), "utf-8")
        .replace(
          '<script id="__SERVER_SIDE_PROPS__"></script>',
          `<script id="__SERVER_SIDE_PROPS__">window.__SERVER_SIDE_PROPS__=${JSON.stringify(
            props
          )}</script>`
        );
      template = await vite.transformIndexHtml(url, template);
      const module = await vite.ssrLoadModule(pathFile);
      const render = module.render;
      res
        .status(200)
        .set({ "Content-Type": "text/html" })
        .send(template.replace(`<!--app-html-->`, render(props)));
    } catch (e) {
      !isProd && vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  };

  app.all("/", route("_root.view", "views/_root.html"));

  return { app, vite };
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(3000, () => {
      console.log("http://localhost:3000");
    })
  );
}

// for test use
exports.createServer = createServer;
