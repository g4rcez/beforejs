import Path from "path";

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

const root = ".";

export namespace Ssr {
    export type DynamicHead<Prefetch = any, Params = Dict, Query = Dict> = React.FC<Props<Prefetch, Params, Query>>;

    export type Prefetch<Prefetch = any, Params = Dict, Query = Dict> = (props: Props<Prefetch, Params, Query>) => Promise<Prefetch> | Prefetch;

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
    export type Props<Prefetch = any | null, Params = Dict, Query = QueryString> = {
        path: string;
        url: string;
        host: string;
        params: Params;
        query: Query;
        prefetch: Prefetch;
        error: Error | null;
        rootDir: string;
    };

    export const sanitizeFilePath = (...paths: string[]) => Path.resolve(Path.join(...paths.filter((x) => !(x.includes("../") || x.includes("./")))));

    export const join = (...paths: string[]) => Path.join(root, ...paths);
    export const resolve = (...paths: string[]) => Path.resolve(Path.join(root, ...paths));
    export const BASE_PATH = "/";

    export const urls = (baseURL: string, ...urls: string[]) =>
        urls.reduce((acc, el) => acc.replace(/\/+$/, "") + "/" + el.replace(/^\/+/, ""), baseURL);
}
