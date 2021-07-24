import React, { useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import "../App.css";
import logo from "../logo.svg";

export const PATH = "/deep-test/:id";

function App(props: any) {
  useEffect(() => {
    console.log("First Render", props);
  }, [props]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button className="w-full bg-blue-700">FUCKING AWESOME LEK</button>
      </header>
    </div>
  );
}

export function render(props: any) {
  return ReactDOMServer.renderToString(<App {...props} />);
}

export default App;
