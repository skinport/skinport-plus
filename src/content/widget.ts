import React from "react";
import { createRoot } from "react-dom/client";
import styles from "tailwind:./widget.css";

export function createWidgetElement(
  reactNode: React.ReactNode | ((shadowRoot: HTMLElement) => React.ReactNode)
) {
  const widgetElement = document.createElement("div");

  widgetElement.classList.add("skinport-widget");

  const shadowRoot = widgetElement.attachShadow({ mode: "open" });

  const styleElement = document.createElement("style");
  styleElement.textContent = styles;

  shadowRoot.append(styleElement);

  const reactRoot = createRoot(shadowRoot);

  reactRoot.render(
    typeof reactNode === "function"
      ? reactNode(shadowRoot as unknown as HTMLElement)
      : reactNode
  );

  const removeWidgetElement = () => {
    if (reactRoot) {
      reactRoot.unmount();
    }
    widgetElement.remove();
  };

  return [widgetElement, removeWidgetElement] as const;
}
