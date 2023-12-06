import { TooltipProvider } from "@/components/ui/tooltip";
import React from "react";
import { createRoot } from "react-dom/client";
import { elementExists } from "select-dom";
import { SWRConfig } from "swr";
import styles from "tailwind:./widget.css";

export function createWidgetElement(
  Widget: React.ComponentType<{
    shadowRoot: HTMLElement;
    widgetElement: HTMLDivElement;
    removeWidgetElement: () => void;
  }>,
  widgetName?: string,
) {
  const widgetElement = document.createElement("div");

  if (widgetName) {
    widgetElement.setAttribute("data-skinport-widget-name", widgetName);
  }

  const shadowRoot = widgetElement.attachShadow({ mode: "closed" });

  const styleElement = document.createElement("style");
  styleElement.textContent = styles;

  shadowRoot.append(styleElement);

  const reactRoot = createRoot(shadowRoot);

  const removeWidgetElement = () => {
    if (reactRoot) {
      reactRoot.unmount();
    }
    widgetElement.remove();
  };

  reactRoot.render(
    <SWRConfig>
      <TooltipProvider>
        <Widget
          shadowRoot={shadowRoot as unknown as HTMLElement}
          widgetElement={widgetElement}
          removeWidgetElement={removeWidgetElement}
        />
      </TooltipProvider>
    </SWRConfig>,
  );

  return [widgetElement, removeWidgetElement] as const;
}

export function widgetElementExists(
  widgetName: string,
  baseElement?: Parameters<typeof elementExists>[1],
) {
  return elementExists(
    `[data-skinport-widget-name='${widgetName}']`,
    baseElement,
  );
}
