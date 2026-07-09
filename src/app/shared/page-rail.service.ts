import { Injectable, signal } from "@angular/core";

export interface PageRailSummaryItem {
  label: string;
  value: string;
}

export interface PageRailOption {
  key: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export interface PageRailSection {
  key: string;
  kind: "summary" | "status" | "filters" | "action";
  kicker: string;
  loading?: boolean;
  optionCount?: number;
  placeholderRows?: number;
  selectedCount?: number;
  secondaryActionDisabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  title?: string;
  items?: PageRailSummaryItem[];
  message?: string;
  options?: readonly PageRailOption[];
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  note?: string;
  error?: string;
}

@Injectable({
  providedIn: "root"
})
export class PageRailService {
  readonly sections = signal<readonly PageRailSection[]>([]);

  setSections(sections: readonly PageRailSection[]): void {
    this.sections.set(sections);
  }

  clearSections(): void {
    this.sections.set([]);
  }
}
