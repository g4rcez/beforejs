import { existsSync, readFileSync, writeFileSync } from "fs";
import glob from "glob";
import parse from "node-html-parser";
import path from "path";
import { minify } from "html-minifier";
type InputOption = { [entryAlias: string]: string };

export const root = process.cwd();

const getBaseFiles = async (dir: string, map: (x: string) => string) => {
    return new Promise<InputOption>(async (res, rej) => {
        glob(dir, (err, files) =>
            err
                ? rej(err)
                : res(
                      files.reduce(
                          (acc, el) => ({
                              ...acc,
                              [map(el)]: el,
                          }),
                          {}
                      )
                  )
        );
    });
};

const getFiles = (dir: string) => new Promise<string[]>((res, rej) => glob(dir, (error, files) => (error ? rej([]) : res(files))));

export const getSsrFiles = async () => {
    const base = await getBaseFiles(
        path.resolve(path.join(root, "src", "**/*.view.tsx")),
        (file: string) => `${path.basename(file, ".view.tsx")}.view`
    );
    const apis = await getBaseFiles(path.resolve(path.join(root, "src", "**/*.api.ts")), (file: string) => `${path.basename(file, ".api.ts")}.api`);
    return {
        ...apis,
        ...base,
        __before: path.resolve(path.join(root, "src", "before", "index.ts")),
        __ssr: path.resolve(path.join(root, "src", "before", "ssr.ts")),
        __server: path.resolve(path.join(root, "src", "before", "prod-server.ts")),
    };
};

const replaceViewToClient = (str: string) => str.replace(/\.view\.tsx$/, ".client.tsx");

export const getHtmlFiles = async () => {
    const files = await getFiles("src/**/*.view.tsx");
    const html = readFileSync(path.resolve(path.join(root, "template.html")), "utf-8");
    return files
        .map((file) => {
            const basename = replaceViewToClient(path.basename(file));
            const dom = parse(html);
            const body = dom.querySelector("body");
            const pathTsx = path.join(".cache", "pages", basename);
            body.appendChild(parse(`<script type="module" src="/${pathTsx}"></script>`));
            if (!existsSync(pathTsx)) {
                writeFileSync(
                    pathTsx,
                    `import ReactDOM from "react-dom";
    import React from "react";
    import App from "../../${file}";
    import Main from "../../src/_main";
    
    ReactDOM.hydrate(
        <Main>
            <App {...JSON.parse((window as any).__SERVER_SIDE_PROPS__.innerText)} />
        </Main>,
        document.getElementById("app")
    );`,
                    { encoding: "utf-8" }
                );
            }
            const htmlFile = pathTsx.replace(/\.client.tsx$/, ".html");
            writeFileSync(
                htmlFile,
                minify(dom.toString(), {
                    caseSensitive: true,
                    html5: true,
                    collapseWhitespace: true,
                    removeComments: true,
                }),
                {
                    encoding: "utf-8",
                }
            );
            return htmlFile;
        })
        .reduce((acc, el) => ({ ...acc, [`${path.basename(el, ".html")}`]: path.resolve(el) }), {});
};
