import { Injectable, signal } from "@angular/core";

export type ClientActivityLevel = "debug" | "error" | "info" | "warn";

export interface ClientActivityEntry {
  id: number;
  level: ClientActivityLevel;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: "root" })
export class ClientActivityLogService {
  readonly entries = signal<readonly ClientActivityEntry[]>([]);
  private nextId = 1;

  add(level: ClientActivityLevel, message: string, details?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `${timestamp} [kamra] ${message}`;
    if (level === "error") console.error(prefix, details ?? "");
    else if (level === "warn") console.warn(prefix, details ?? "");
    else console.log(prefix, details ?? "");
    this.entries.update((entries) => [...entries.slice(-79), { id: this.nextId++, level, message, timestamp }]);
  }
}
