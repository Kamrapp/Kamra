import { Injectable, inject } from "@angular/core";

import { logBrowserEvent, type BrowserLogPayload } from "./browser-logger";
import { ClientActivityLogService } from "./client-activity-log.service";

@Injectable({ providedIn: "root" })
export class BrowserLoggerService {
  private readonly activity = inject(ClientActivityLogService);
  private readonly appEnvironment = "browser";
  private readonly clientId = readClientId();

  log(
    level: BrowserLogPayload["level"],
    message: string,
    details?: Record<string, unknown>,
    options?: { sendToServer?: boolean }
  ): void {
    const context = {
      clientId: this.clientId,
      environment: this.appEnvironment,
      pathname: window.location.pathname,
      ...details
    };
    this.activity.add(level, message, context);
    if (options?.sendToServer ?? (level === "warn" || level === "error"))
      logBrowserEvent({ clientId: this.clientId, details: context, level, message });
  }
}

function readClientId(): string {
  const key = "kamra_client_id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const clientId = crypto.randomUUID();
  window.sessionStorage.setItem(key, clientId);
  return clientId;
}
