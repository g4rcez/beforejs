import React, { useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import "./App.css";
import logo from "./logo.svg";

export const PATH = "/";
export const createHead: Ssr.CreateHead = () => `
    <title>Insert title tag</title>
  `;

function App(props: any) {
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    console.log("First Render", props);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <p>
          <button
            type="button"
            className="bg-black text-white rounded px-4 py-2"
            onClick={() => setCount((count: number) => count + 1)}
          >
            count is: {count}
 m       </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
      </header>
    </div>
  );
}

export const render = (props: any) =>
  ReactDOMServer.renderToString(<App {...props} />);

export default App;
