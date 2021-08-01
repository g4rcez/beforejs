import axios from "axios";
import React, { useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import "../App.css";
import logo from "../logo.svg";

export const PATH = "/deep-test/:cep";

type Params = { cep: string };

export const prefetch: Ssr.Prefetch<any, Params, Params> = async (
  props: Ssr.Props<any, Params>
) => {
  const cep = props.params.cep;
  const response = await axios.get(`https://api.postmon.com.br/v1/cep/${cep}`);
  return response.data;
};

function App(props: Ssr.Props<Params>) {
  useEffect(() => {
    console.log("First Render", props);
  }, [props]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button className="bg-blue-700 px-4 py-2 border-blue-500 rounded-lg border">
          FUCKING AWESOME LEK
        </button>
        <div className="w-64 flex word-break">
            {JSON.stringify(props.prefetch)}
        </div>
      </header>
    </div>
  );
}

export function render(props: any) {
  return ReactDOMServer.renderToString(<App {...props} />);
}

export default App;
