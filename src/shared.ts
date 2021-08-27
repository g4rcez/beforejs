import { Request, Response } from "express";

export type UrlParams<T extends string> = string extends T
    ? Record<string, string>
    : T extends `${infer _}:${infer Param}/${infer Rest}`
    ? { [k in Param | keyof UrlParams<Rest>]: string }
    : T extends `${infer _}:${infer Param}`
    ? { [k in Param]: string }
    : {};

export const registerApi = <Path extends string>(
    path: Path,
    handlers: Array<{
        method: "get" | "post" | "put" | "delete" | "patch";
        handler: (req: Request<UrlParams<Path>>, res: Response) => any;
    }>
) => ({ path, handlers });
