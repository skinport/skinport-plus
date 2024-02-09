import { Toaster } from "@/components/ui/toaster";
import domLoaded from "dom-loaded";
import { createWidgetElement } from "./widget";

export async function addToaster() {
  await domLoaded;

  const [toasterElement] = createWidgetElement(() => <Toaster />);

  document.body.append(toasterElement);
}
