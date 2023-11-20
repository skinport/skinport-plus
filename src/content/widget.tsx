import React from "react";
import { createRoot } from "react-dom/client";
import styles from "tailwind:./widget.css";

export function createWidgetElement(
  Widget: React.ComponentType<{ shadowRoot: HTMLElement }>,
) {
  const widgetElement = document.createElement("div");

  widgetElement.classList.add("skinport-widget");

  const shadowRoot = widgetElement.attachShadow({ mode: "open" });

  const styleElement = document.createElement("style");
  styleElement.textContent = styles;

  shadowRoot.append(styleElement);

  const reactRoot = createRoot(shadowRoot);

  reactRoot.render(<Widget shadowRoot={shadowRoot as any as HTMLElement} />);

  const removeWidgetElement = () => {
    if (reactRoot) {
      reactRoot.unmount();
    }
    widgetElement.remove();
  };

  return [widgetElement, removeWidgetElement] as const;
}
