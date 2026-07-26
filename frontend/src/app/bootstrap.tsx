import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppProviders } from "./Providers";
import { logger } from "../core/logger/logger";
import "../styles.css";

export function bootstrap() {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("JCWS root element was not found");

  logger.info("Bootstrapping JCWS frontend");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>,
  );
}
