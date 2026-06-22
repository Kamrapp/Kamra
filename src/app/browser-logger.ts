export interface BrowserLogPayload {
  details?: unknown;
  level: "debug" | "info" | "warn" | "error";
  message: string;
}

function timestamp(): string {
  return new Date().toISOString();
}

export function logBrowserEvent(
  level: BrowserLogPayload["level"],
  message: string,
  details?: unknown
): void {
  const prefix = `${timestamp()} [kamra] ${message}`;

  if (level === "error") {
    console.error(prefix, details ?? "");
  } else if (level === "warn") {
    console.warn(prefix, details ?? "");
  } else {
    console.log(prefix, details ?? "");
  }

  const payload: BrowserLogPayload = {
    details,
    level,
    message
  };

  void fetch("/api/log", {
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
