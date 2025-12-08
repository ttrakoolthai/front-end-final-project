import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

if (process.env.NODE_ENV === "development") {
    // Lazy-load axe only in dev
    import("@axe-core/react").then((axe) => {
        const ReactDOMLib = require("react-dom");
        axe.default(React, ReactDOMLib, 1000);
    });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
