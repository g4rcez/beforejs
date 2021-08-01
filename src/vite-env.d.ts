/// <reference types="vite/client" />

declare global {
  interface Window {
    __SERVER_SIDE_PROPS__: any;
  }
}

type StringObject = Partial<Record<string, string>>;

export declare global {
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
    ) => Promise<{ props: Prefetch }>;

    export type CreateHead<
      Prefetch = any,
      Params = StringObject,
      Query = StringObject
    > = (props: Ssr.Props<Prefetch, Params, Query>) => string;
  }
}
