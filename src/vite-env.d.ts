/// <reference types="vite/client" />

import React from "react";

declare global {
    interface Window {
        __SERVER_SIDE_PROPS__: any;
    }
}

type StringObject = Partial<Record<string, string>>;

export declare global {
    export declare namespace Server {
        // ref: https://github.com/ghoullier/awesome-template-literal-types#router-params-parsing
        export type UrlParams<T extends string> = string extends T
            ? Record<string, string>
            : T extends `${infer Start}:${infer Param}/${infer Rest}`
            ? { [k in Param | keyof UrlParams<Rest>]: string }
            : T extends `${infer Start}:${infer Param}`
            ? { [k in Param]: string }
            : {};
    }
    export declare namespace Ssr {
        export type Props<
            Prefetch = any | null,
            Params = StringObject,
            Query = StringObject
        > = {
            url: string;
            host: string;
            params: Params;
            query: Query;
            prefetch: Prefetch;
        };

        export type Prefetch<
            Prefetch = any,
            Params = StringObject,
            Query = StringObject
        > = (
            props: Ssr.Props<Prefetch, Params, Query>
        ) => Promise<{ props: Prefetch }> | { props: Prefetch };

        export type DynamicHead<
            Prefetch = any,
            Params = StringObject,
            Query = StringObject
        > = React.FC<Ssr.Props<Prefetch, Params, Query>>;
    }
}
