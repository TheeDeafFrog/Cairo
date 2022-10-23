import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

const reactRoot = document.createElement('div');
reactRoot.id = 'react_root';
document.body.appendChild(reactRoot);

const root = ReactDOM.createRoot(reactRoot);
root.render(<App/>);
