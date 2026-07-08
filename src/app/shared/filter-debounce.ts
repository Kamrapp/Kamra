export const FILTER_INPUT_DEBOUNCE_MS = 500;

export class DebouncedFilterAction {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly delayMs = FILTER_INPUT_DEBOUNCE_MS) {}

  cancel(): void {
    if (!this.timer) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = null;
  }

  schedule(action: () => void): void {
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      action();
    }, this.delayMs);
  }
}
