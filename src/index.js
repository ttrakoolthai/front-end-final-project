import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";

import "./styles.css";

if (process.env.NODE_ENV === "development") {
    // Accessibilty testing tool
    import("@axe-core/react").then((axe) => {
        const ReactDOMLib = require("react-dom");
        axe.default(React, ReactDOMLib, 1000);
    });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
