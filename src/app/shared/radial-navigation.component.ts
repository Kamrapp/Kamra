import { Component, effect, inject, input, output, signal } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { LocalizationService, type TranslationKey } from "./localization.service";

export interface RadialNavigationItem {
  angle: number;
  exact: boolean;
  iconPath: string;
  labelKey: TranslationKey;
  path: string;
}

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: "app-radial-navigation",
  standalone: true,
  template: `
    <div class="radial-menu" [class.radial-menu-open]="isOpen()">
      <nav id="primary-menu" class="radial-nav" [attr.aria-label]="loc.t('app.primaryNavigation')">
        @for (item of items(); track item.path) {
          <a
            class="radial-nav-item"
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="item.exact ? { exact: true } : { exact: false }"
            [style.--item-angle]="item.angle + 'deg'"
            [attr.aria-label]="loc.t(item.labelKey)"
            [attr.data-label]="loc.t(item.labelKey)"
            (click)="closeAfterNavigation()"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path [attr.d]="item.iconPath"></path>
            </svg>
            <span>{{ loc.t(item.labelKey) }}</span>
          </a>
        }
      </nav>

      <button
        class="radial-menu-button"
        type="button"
        [attr.aria-label]="loc.t('app.toggleNavigation')"
        aria-controls="primary-menu"
        [attr.aria-expanded]="isOpen()"
        (click)="toggle()"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          @if (isOpen()) {
            <path
              d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z"
            ></path>
          } @else {
            <path d="M4 6.5H20V8.5H4V6.5ZM4 11H20V13H4V11ZM4 15.5H20V17.5H4V15.5Z"></path>
          }
        </svg>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        --item-radius: clamp(5.2rem, 8vw, 6.8rem);
        --mini-item-radius: clamp(3.65rem, 5vw, 4.2rem);
        display: block;
        height: 1px;
        position: fixed;
        right: max(1.25rem, env(safe-area-inset-right));
        top: 50%;
        width: 1px;
        z-index: 35;
      }

      .radial-menu-button {
        align-items: center;
        background: color-mix(
          in srgb,
          var(--color-accent-leaf-strong) 82%,
          var(--color-wood-deep) 18%
        );
        border: 1px solid color-mix(in srgb, var(--color-accent-leaf-strong) 55%, white 45%);
        border-radius: var(--radius-pill);
        box-shadow: 0 1rem 2.6rem rgb(48 43 50 / 22%);
        color: white;
        cursor: pointer;
        display: inline-flex;
        height: 4.3rem;
        justify-content: center;
        padding: 0;
        position: absolute;
        right: 0;
        top: 0;
        transform: translate(0, -50%);
        transition:
          box-shadow 180ms ease,
          transform 180ms ease;
        width: 4.3rem;
        z-index: 2;
      }

      .radial-menu-button:hover,
      .radial-menu-open .radial-menu-button {
        box-shadow: 0 1.2rem 3rem rgb(48 43 50 / 28%);
        transform: translate(0, -50%) scale(1.04);
      }

      .radial-menu-button svg,
      .radial-nav-item svg {
        display: block;
        fill: currentColor;
      }

      .radial-menu-button svg {
        color: white;
        height: 1.55rem;
        width: 1.55rem;
      }

      .radial-nav {
        inset: 0;
        position: absolute;
      }

      .radial-nav-item {
        align-items: center;
        background: color-mix(in srgb, var(--color-surface) 92%, white 8%);
        border: 1px solid var(--line-strong);
        border-radius: var(--radius-pill);
        box-shadow: 0 0.45rem 1.2rem rgb(48 43 50 / 16%);
        color: var(--color-text);
        display: flex;
        gap: 0;
        height: 2.35rem;
        justify-content: center;
        min-height: 2.35rem;
        min-width: 2.35rem;
        opacity: 0.96;
        overflow: visible;
        padding: 0;
        pointer-events: auto;
        position: absolute;
        right: 0;
        top: 0;
        text-decoration: none;
        transform: translate(0, -50%) rotate(var(--item-angle)) translateX(var(--mini-item-radius))
          rotate(calc(-1 * var(--item-angle))) scale(0.94);
        transform-origin: center;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          box-shadow 180ms ease,
          gap 220ms ease,
          height 240ms cubic-bezier(0.2, 0.9, 0.2, 1.08),
          min-height 240ms cubic-bezier(0.2, 0.9, 0.2, 1.08),
          min-width 240ms cubic-bezier(0.2, 0.9, 0.2, 1.08),
          opacity 180ms ease,
          padding 240ms cubic-bezier(0.2, 0.9, 0.2, 1.08),
          transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1.08);
        white-space: nowrap;
        width: 2.35rem;
        z-index: 1;
      }

      .radial-menu-open .radial-nav-item {
        box-shadow: 0 0.8rem 2rem rgb(48 43 50 / 14%);
        gap: 0.55rem;
        height: auto;
        justify-content: flex-start;
        min-height: 3rem;
        min-width: 7.4rem;
        opacity: 1;
        overflow: visible;
        padding: 0.48rem 0.68rem;
        transform: translate(0, -50%) rotate(var(--item-angle)) translateX(var(--item-radius))
          rotate(calc(-1 * var(--item-angle))) scale(1);
        width: auto;
      }

      .radial-nav-item:hover,
      .radial-nav-item.active {
        background: color-mix(in srgb, var(--color-accent-sky) 34%, var(--color-card-tint) 66%);
        border-color: color-mix(in srgb, var(--color-accent-sky) 48%, var(--color-wood-deep) 52%);
      }

      .radial-nav-item svg {
        color: var(--color-wood-deep);
        flex: 0 0 auto;
        height: 1rem;
        transition:
          height 220ms ease,
          width 220ms ease;
        width: 1rem;
      }

      .radial-nav-item.active svg {
        color: var(--color-on-soft-accent);
      }

      .radial-menu-open .radial-nav-item svg {
        height: 1.18rem;
        width: 1.18rem;
      }

      .radial-nav-item span {
        font-size: 0.86rem;
        font-weight: 800;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        transition:
          max-width 220ms ease,
          opacity 160ms ease 70ms;
      }

      .radial-menu-open .radial-nav-item span {
        max-width: 7rem;
        opacity: 1;
      }

      @media (max-width: 520px) {
        :host {
          --item-radius: 5.2rem;
          right: 0.9rem;
        }

        .radial-menu-open .radial-nav-item {
          min-width: 6.8rem;
        }
      }
    `
  ]
})
export class RadialNavigationComponent {
  readonly items = input.required<readonly RadialNavigationItem[]>();
  readonly resetToken = input(0);
  readonly navigationSelected = output<void>();
  readonly loc = inject(LocalizationService);
  readonly isOpen = signal(false);

  constructor() {
    effect(() => {
      this.resetToken();
      this.isOpen.set(false);
    });
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  closeAfterNavigation(): void {
    this.isOpen.set(false);
    this.navigationSelected.emit();
  }
}
