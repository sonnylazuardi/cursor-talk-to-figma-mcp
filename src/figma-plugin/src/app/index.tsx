import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles/base.scss";

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("react-page");
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
});
