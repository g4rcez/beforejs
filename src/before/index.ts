import { Express, NextFunction, Request, Response } from "express";
import { parse } from "node-html-parser";
import Path from "path";
import React from "react";
import { renderToString } from "react-dom/server";

type Dict = Partial<Record<string, string>>;

type QueryString = string | string[] | undefined;

type Props<Prefetch = any | null, Params = Dict, Query = QueryString> = {
    path: string;
    url: string;
    host: string;
    params: Params;
    query: Query;
    prefetch: Prefetch;
    error: Error | null;
    rootDir: string;
};

type DynamicHead<Prefetch = any, Params = Dict, Query = Dict> = React.FC<Props<Prefetch, Params, Query>>;

type Prefetch<Prefetch = any, Params = Dict, Query = Dict> = (props: Props<Prefetch, Params, Query>) => Promise<Prefetch> | Prefetch;

const root = process.cwd();

export namespace ApiBefore {
    export const BASE_PATH = "/";
    export type Module = {
        DynamicHead: DynamicHead;
        prefetch: Prefetch;
        PATH: string;
        default: React.FC<any>;
    };
    export type UrlParams<T extends string> = string extends T
        ? Record<string, string>
        : T extends `${infer _}:${infer Param}/${infer Rest}`
        ? { [k in Param | keyof UrlParams<Rest>]: string }
        : T extends `${infer _}:${infer Param}`
        ? { [k in Param]: string }
        : {};

    export const route = <Path extends string>(
        path: Path,
        handlers: Array<{
            method: "get" | "post" | "put" | "delete" | "patch";
            handler: (req: Request<UrlParams<Path>>, res: Response) => any;
        }>,
        middlewares: Array<(req: Request<UrlParams<Path>>, res: Response, next: NextFunction) => Promise<unknown> | unknown> = []
    ) => ({ path, handlers, middlewares });

    export type ApiHandler = ReturnType<typeof route>;

    export const createComponentProps = async (req: Request, module: Module): Promise<Props> => {
        const props: Props = {
            path: req.path,
            url: req.originalUrl,
            host: req.hostname,
            params: req.params,
            query: req.query as never,
            prefetch: null,
            error: null as any,
            rootDir: ".",
        };
        if (module.prefetch) {
            try {
                const response: Prefetch = await module.prefetch(props as never);
                props.prefetch = response;
            } catch (error) {
                console.error(error);
                props.error = error as any;
            }
        }
        return props;
    };

    export const createApiRouter = (config: ApiHandler, express: Express, basePath: string = BASE_PATH) => {
        config.handlers.map((route) => express[route.method](urls(basePath, "api", config.path), ...config.middlewares, route.handler));
    };

    export const render = async (htmlTemplate: string, mainModule: React.FC<any>, module: ApiBefore.Module, props: Props): Promise<string> => {
        const html = parse(htmlTemplate);
        const head = html.querySelector("head");
        if (module.DynamicHead) {
            head.appendChild(parse(renderToString(React.createElement(module.DynamicHead, props as never))));
        }
        const app = html.querySelector("#app");
        head.appendChild(parse(`<script id="__SERVER_SIDE_PROPS__" type="application/ld+json">${JSON.stringify(props)}</script>`));
        app.innerHTML = renderToString(React.createElement(mainModule, {}, React.createElement(module.default, props)));
        return html.toString();
    };

    export const sanitizeFilePath = (...paths: string[]) => Path.resolve(Path.join(...paths.filter((x) => !(x.includes("../") || x.includes("./")))));

    export const join = (...paths: string[]) => Path.join(root, ...paths);
    export const resolve = (...paths: string[]) => Path.resolve(Path.join(root, ...paths));

    export const urls = (baseURL: string, ...urls: string[]) =>
        urls.reduce((acc, el) => acc.replace(/\/+$/, "") + "/" + el.replace(/^\/+/, ""), baseURL);
}
