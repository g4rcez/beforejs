import ReactDOM from "react-dom";
import App from "./App.page";
import React from "react";

declare global {
  interface Window {
    __SERVER_SIDE_PROPS__: any;
  }
}

ReactDOM.hydrate(
  <App {...window.__SERVER_SIDE_PROPS__} />,
  document.getElementById("app")
);
