import React from "react";
import { createRoot } from "react-dom/client";
import styles from "tailwind:./widget.css";
import { elementExists } from "select-dom";

export function createWidgetElement(
  Widget: React.ComponentType<{ shadowRoot: HTMLElement }>,
  widgetName?: string,
) {
  const widgetElement = document.createElement("div");

  widgetElement.classList.add("skinport-widget");

  if (widgetName) {
    widgetElement.setAttribute("data-widget-name", widgetName);
  }

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

export function widgetElementExists(
  widgetName: string,
  baseElement?: Parameters<typeof elementExists>[1],
) {
  return elementExists(`[data-widget-name='${widgetName}']`, baseElement);
}
