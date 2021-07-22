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
  if (!isProd) {
    vite = await require("vite").createServer({
      root,
      logLevel: isTest ? "error" : "info",
      server: {
        middlewareMode: "ssr",
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
      },
    });
    // use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    app.use(
      require("serve-static")(resolve("foo-app/client"), {
        index: false,
      })
    );
  }

  const route = (file, htmlPath) => async (req, res) => {
    try {
      const a = resolve(`foo-app/client/${htmlPath}`);
      console.log("PATHS", a);
      const indexProd = isProd ? fs.readFileSync(a, "utf-8") : "";

      const url = req.originalUrl;

      let template, render;

      const context = {};

      const props = { url, context, host: req.hostname };

      if (!isProd) {
        // always read fresh template in dev
        template = fs
          .readFileSync(resolve(htmlPath), "utf-8")
          .replace(
            '<script id="__SERVER_SIDE_PROPS__"></script>',
            `<script id="__SERVER_SIDE_PROPS__">window.__SERVER_SIDE_PROPS__=${JSON.stringify(
              props
            )}</script>`
          );
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/entry-server.tsx")).render;
      } else {
        template = indexProd.replace(
          '<script id="__SERVER_SIDE_PROPS__"></script>',
          `<script id="__SERVER_SIDE_PROPS__">window.__SERVER_SIDE_PROPS__=${JSON.stringify(
            props
          )}</script>`
        );
        render = require(`./foo-app/server/${file}`).render;
      }

      if (context.url) {
        // Somewhere a `<Redirect>` was rendered
        return res.redirect(301, context.url);
      }
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

  app.all("/", route("App.page", "index.html"));
  app.all("/test", route("Test.page", "test/index.html"));

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
