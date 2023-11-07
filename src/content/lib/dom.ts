import { type ReactNode } from "react";
import { createRoot } from "react-dom/client";

export function createRootElement(reactNode: ReactNode) {
  const rootElement = document.createElement("div");

  rootElement.classList.add("sp-root");

  const spRoot = createRoot(rootElement);

  spRoot.render(reactNode);

  return rootElement;
}
