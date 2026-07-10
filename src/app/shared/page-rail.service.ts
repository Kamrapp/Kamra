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

export interface PageRailShoppingScaleOption {
  key: string;
  label: string;
  hint: string;
  active: boolean;
}

export interface PageRailSection {
  key: string;
  kind: "summary" | "status" | "filters" | "action" | "shopping";
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
  cancelActionDisabled?: boolean;
  cancelActionLabel?: string;
  itemCount?: number;
  itemCountLabel?: string;
  onCancelAction?: () => void;
  onReloadAction?: () => void;
  onScaleIndexChange?: (value: number | string) => void;
  reloadActionDisabled?: boolean;
  reloadActionLabel?: string;
  scaleIndex?: number;
  scaleOptions?: readonly PageRailShoppingScaleOption[];
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
