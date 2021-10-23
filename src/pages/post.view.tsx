import fs from "fs";
import React from "react";
import { Ssr } from "../before/ssr";
import axios from "axios";

export const PATH = "/post/:name";

export const DynamicHead: Ssr.DynamicHead = (props) => <title>Welcome to ${props.host}</title>;

export const prefetch: Ssr.Prefetch<{ text: string }, Ssr.UrlParams<typeof PATH>> = async (props) => {
    const response = await axios.get("https://api.postmon.com.br/v1/cep/22740310");
    console.log("RESPONSE, PASSWORD", response.data);
    const postName = props.params.name;
    const text = fs.readFileSync(Ssr.sanitizeFilePath(props.rootDir, "posts", `${postName}.md`), "utf-8");
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
