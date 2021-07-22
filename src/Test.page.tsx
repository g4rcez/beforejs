import React, { useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import "./App.css";

function App(props: any) {
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    console.log("First Render", props);
  }, []);

  return (
    <div className="App">
      <header className="App-header">Testing SSR with other routes</header>
    </div>
  );
}

export function render(props: any) {
  return ReactDOMServer.renderToString(<App {...props} />);
}

export default App;
