import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

function initApp() {
  const rootElement = document.getElementById("root");
  console.log(rootElement);
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
