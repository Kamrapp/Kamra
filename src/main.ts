import { bootstrapApplication } from "@angular/platform-browser";

import { AppComponent } from "./app/app.component";
import { logBrowserEvent } from "./app/browser-logger";
import { appConfig } from "./app/app.config";

logBrowserEvent("info", "Browser app starting", {
  baseUri: document.baseURI,
  location: window.location.href,
  nodeEnv: "browser"
});

void bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  logBrowserEvent("error", "Browser bootstrap failed", error);
});
