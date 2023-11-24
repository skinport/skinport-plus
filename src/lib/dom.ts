export function injectStyle(css: string) {
  if (!css || typeof document === "undefined") return;

  const headElement = document.head || document.getElementsByTagName("head")[0];
  const styleElement = document.createElement("style");

  headElement.appendChild(styleElement);

  styleElement.appendChild(document.createTextNode(css));
}
