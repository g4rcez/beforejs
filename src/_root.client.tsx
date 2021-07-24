import ReactDOM from "react-dom";
import App from "./_root.view";
import React from "react";

ReactDOM.hydrate(
  <App {...window.__SERVER_SIDE_PROPS__} />,
  document.getElementById("app")
);
