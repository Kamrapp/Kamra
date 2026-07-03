import { Injectable, signal } from "@angular/core";

export type ToastTone = "error" | "info" | "success" | "warning";

export interface ToastEntry {
  id: number;
  message: string;
  tone: ToastTone;
}

@Injectable({
  providedIn: "root"
})
export class ToastService {
  readonly toasts = signal<ToastEntry[]>([]);
  private nextId = 1;

  push(message: string, tone: ToastTone = "error"): void {
    const entry: ToastEntry = {
      id: this.nextId++,
      message,
      tone
    };

    this.toasts.update((current) => [...current, entry]);

    window.setTimeout(() => {
      this.dismiss(entry.id);
    }, 4200);
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }
}
