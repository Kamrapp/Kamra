import { buildApiUrl } from "./api-url";

export interface BrowserLogPayload {
  clientId: string;
  details?: unknown;
  level: "debug" | "info" | "warn" | "error";
  message: string;
}

export function logBrowserEvent(
  payload: BrowserLogPayload
): void {
  void fetch(buildApiUrl("/api/log"), {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json"
    },
    keepalive: true,
    method: "POST"
  }).catch(() => {
    // Logging must never break the app.
  });
}
