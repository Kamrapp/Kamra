import { computed, Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class NavigationHistoryService {
  private readonly urls = signal<readonly string[]>([]);
  private readonly currentIndex = signal(-1);
  private suppressedUrl: string | null = null;

  readonly canGoBack = computed(() => this.currentIndex() > 0);
  readonly canGoForward = computed(
    () => this.currentIndex() >= 0 && this.currentIndex() < this.urls().length - 1
  );

  record(url: string): void {
    if (this.suppressedUrl === url) {
      this.suppressedUrl = null;
      return;
    }
    this.suppressedUrl = null;
    if (this.urls()[this.currentIndex()] === url) return;

    const nextUrls = [...this.urls().slice(0, this.currentIndex() + 1), url];
    this.urls.set(nextUrls);
    this.currentIndex.set(nextUrls.length - 1);
  }

  backTarget(): string | null {
    if (!this.canGoBack()) return null;
    const target = this.urls()[this.currentIndex() - 1] ?? null;
    if (target) {
      this.suppressedUrl = target;
      this.currentIndex.update((index) => index - 1);
    }
    return target;
  }

  forwardTarget(): string | null {
    if (!this.canGoForward()) return null;
    const target = this.urls()[this.currentIndex() + 1] ?? null;
    if (target) {
      this.suppressedUrl = target;
      this.currentIndex.update((index) => index + 1);
    }
    return target;
  }
}
