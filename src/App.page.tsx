import React, { useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import "./App.css";
import logo from "./logo.svg";

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
            onClick={() => setCount((count: number) => count + 1)}
          >
            count is: {count}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  );
}

export function render(props: any) {
  return ReactDOMServer.renderToString(<App {...props} />);
}

export default App;
