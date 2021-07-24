import ReactDOM from "react-dom";
import App from "./deep-test.view";
import React from "react";
import "../index.css";

ReactDOM.hydrate(
  <App {...window.__SERVER_SIDE_PROPS__} />,
  document.getElementById("app")
);
