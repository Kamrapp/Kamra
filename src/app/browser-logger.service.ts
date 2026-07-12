import { Injectable } from "@angular/core";

import { logBrowserEvent, type BrowserLogPayload } from "./browser-logger";

@Injectable({ providedIn: "root" })
export class BrowserLoggerService {
  private readonly appEnvironment = "browser";

  log(
    level: BrowserLogPayload["level"],
    message: string,
    details?: Record<string, unknown>
  ): void {
    logBrowserEvent(level, message, {
      environment: this.appEnvironment,
      ...details
    });
  }
}
