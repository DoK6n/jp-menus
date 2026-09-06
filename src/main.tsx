import { render } from "solid-js/web";

import { App } from "./app";
import "../styles/tailwind.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("#root element was not found");
}

render(() => <App />, root);
