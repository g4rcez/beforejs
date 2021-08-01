import fs from "fs";
import path from "path";
import express, { Request, Response } from "express";

const resolve = (p: string) => path.resolve(__dirname, p);

async function createServer() {
  const app = express();
  app.use(
    require("serve-static")(
      resolve(path.join(process.cwd(), "dist", "client")),
      {
        index: false,
      }
    )
  );

  const route =
    (file: string, htmlPath: string) => async (req: Request, res: Response) => {
      try {
        const indexProd = fs.readFileSync(htmlPath, "utf-8");

        const url = req.originalUrl;

        let template, render;

        const context = {};

        const props = { url, context, host: req.hostname };
        template = indexProd.replace(
          '<script id="__SERVER_SIDE_PROPS__"></script>',
          `<script id="__SERVER_SIDE_PROPS__">window.__SERVER_SIDE_PROPS__=${JSON.stringify(
            props
          )}</script>`
        );
        render = require(path.join(
          process.cwd(),
          "dist",
          "server",
          file
        )).render;
        res
          .status(200)
          .set({ "Content-Type": "text/html" })
          .send(template.replace(`<!--app-html-->`, render(props)));
      } catch (e) {
        console.log(e.stack);
        res.status(500).end(e.stack);
      }
    };

  app.all("/", route("_root.view", "dist/client/views/_root.html"));
  app.all(
    "/deep-test/:cep",
    route("deep-test.view", "dist/client/views/deep-test.html")
  );

  return app;
}

createServer().then((app) =>
  app.listen(3000, () => {
    console.log("http://localhost:3000");
  })
);
