import React, { useEffect } from "react";
import "./App.css";
import logo from "./logo.svg";

export const PATH = "/";

export const createHead: Ssr.CreateHead = (props) => `
    <title>Welcome to ${props.host}</title>
  `;

export default function App(props: Ssr.Props) {
    const [count, setCount] = React.useState(0);

    useEffect(() => {
        console.log("First Render", props);
    }, []);

    return (
        <div className="App">
            <header className="App-header">
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
        </div>
    );
}
