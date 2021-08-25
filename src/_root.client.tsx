import ReactDOM from "react-dom";
import React from "react";
import App from "./_root.view";

ReactDOM.hydrate(
    <App {...window.__SERVER_SIDE_PROPS__} />,
    document.getElementById("app")
);
