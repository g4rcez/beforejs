import React from "react";
import logo from "../logo.svg";
import "../App.css";
import { Ssr } from "../before/ssr";
import { ApiBefore } from "../before";

export const config: ApiBefore.Config = {
    DynamicHead: (props) => <title>Welcome to {props.host}</title>,
    prefetch: async () => {
        return { count: 100 };
    },
};

export const PATH = "/";


export default function App(props: Ssr.Props) {
    const [count, setCount] = React.useState(props.prefetch.count);

    React.useEffect(() => console.log("First Render", props), []);

    return (
        <header className="App-header rounded-lg text-center h-full">
            <img src={logo} className="App-logo" alt="logo" />
            <p>Hello BeforeJS</p>
            <p>
                <button type="button" className="bg-black text-white rounded px-4 py-2" onClick={() => setCount((count: number) => count + 1)}>
                    count is: {count}
                </button>
            </p>
            <p>
                Edit <code>App.tsx</code> and save to test HMR updates.
            </p>
        </header>
    );
}
