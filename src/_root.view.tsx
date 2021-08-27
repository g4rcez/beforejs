import React, { useEffect } from "react";
import "./App.css";
import logo from "./logo.svg";

export const PATH = "/";

export const DynamicHead: Ssr.DynamicHead = (props) => (
    <title>Welcome to ${props.host}</title>
);

export const prefetch: Ssr.Prefetch = () => ({
    props: { count: 100 },
});

export default function App(props: Ssr.Props) {
    const [count, setCount] = React.useState(props.prefetch.count);

    useEffect(() => {
        console.log("First Render", props);
    }, []);

    return (
        <header className="App-header rounded-lg text-center h-full">
            <img src={logo} className="App-logo" alt="logo" />
            <p>Hello BeforeJS</p>
            <p>
                <button
                    type="button"
                    className="bg-black text-white rounded px-4 py-2"
                    onClick={() => setCount((count: number) => count + 1)}
                >
                    count is: {count}
                </button>
            </p>
            <p>
                Edit <code>App.tsx</code> and save to test HMR updates.
            </p>
        </header>
    );
}
