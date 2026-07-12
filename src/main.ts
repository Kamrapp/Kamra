import { bootstrapApplication } from "@angular/platform-browser";
import { injectSpeedInsights } from "@vercel/speed-insights";

import { AppComponent } from "./app/app.component";
import { logBrowserEvent } from "./app/browser-logger";
import { appConfig } from "./app/app.config";

injectSpeedInsights({
  framework: "angular"
});

void bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  logBrowserEvent({ clientId: "bootstrap", details: error, level: "error", message: "Browser bootstrap failed" });
});
