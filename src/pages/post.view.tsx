import * as fs from "fs";
import * as React from "react";
import { Before } from "../before";

export const PATH = "/post/:name";

export const DynamicHead: Ssr.DynamicHead = (props) => <title>Welcome to ${props.host}</title>;

export const prefetch: Ssr.Prefetch<{ text: string }, Before.UrlParams<typeof PATH>> = async (props) => {
    const postName = props.params.name;
    const text = fs.readFileSync(Before.sanitizeFilePath(process.cwd(), "posts", `${postName}.md`), "utf-8");
    return { text };
};

export default function App(props: Ssr.Props) {
    React.useEffect(() => console.log("First Render", props), []);

    return (
        <header className="App-header rounded-lg text-center h-full">
            <p>Hello BeforeJS</p>
            <p>{props.prefetch.text}</p>
        </header>
    );
}
