import { Request, Response } from "express";
import parse from "node-html-parser";
import Path from "path";
import { createElement, FC } from "react";
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
};

type DynamicHead<Prefetch = any, Params = Dict, Query = Dict> = FC<Props<Prefetch, Params, Query>>;

type Prefetch<Prefetch = any, Params = Dict, Query = Dict> = (props: Props<Prefetch, Params, Query>) => Promise<Prefetch> | Prefetch;

const root = process.cwd();

export namespace Before {
    export type Module = {
        DynamicHead: DynamicHead;
        prefetch: Prefetch;
        PATH: string;
        default: FC<any>;
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
        }>
    ) => ({ path, handlers });

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

    export const render = async (htmlTemplate: string, mainModule: FC<any>, module: Before.Module, props: Props): Promise<string> => {
        const html = parse(htmlTemplate);
        const head = html.querySelector("head");
        if (module.DynamicHead) {
            head.appendChild(parse(renderToString(createElement(module.DynamicHead, props as never))));
        }
        const app = html.querySelector("#app");
        head.appendChild(parse(`<script id="__SERVER_SIDE_PROPS__" type="application/ld+json">${JSON.stringify(props)}</script>`));
        app.innerHTML = renderToString(createElement(mainModule, {}, createElement(module.default, props)));
        return html.toString();
    };

    export const join = (...paths: string[]) => Path.join(root, ...paths);
    export const resolve = (...paths: string[]) => Path.resolve(Path.join(root, ...paths));
}
