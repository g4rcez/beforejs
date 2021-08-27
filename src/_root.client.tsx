import ReactDOM from "react-dom";
import React from "react";
import App from "./_root.view";
import { Main } from "./_main";

ReactDOM.hydrate(
    <Main>
        <App {...JSON.parse(window.__SERVER_SIDE_PROPS__.innerText)} />
    </Main>,
    document.getElementById("app")
);
