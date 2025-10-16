import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// (opciono) globalni axios baseURL/interceptor ovde
// import "./api-setup"; // ako imaš posebnu datoteku

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);