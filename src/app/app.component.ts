import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <main class="shell" aria-label="Kamra skeleton">
      <section class="brand-panel" aria-labelledby="brand-title">
        <img class="brand-mark" src="/brand/kamra-basket.png" alt="" width="220" height="220" />
        <p class="eyebrow">Kamra</p>
        <h1 id="brand-title">Pantry foundations, gently stocked.</h1>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .shell {
        align-items: center;
        display: flex;
        justify-content: center;
        padding: var(--space-page);
        min-height: 100vh;
      }

      .brand-panel {
        align-items: center;
        display: grid;
        gap: var(--space-4);
        justify-items: center;
        text-align: center;
      }

      .brand-mark {
        aspect-ratio: 1;
        height: auto;
        width: min(52vw, 220px);
      }

      .eyebrow {
        color: var(--color-text-muted);
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 0;
        margin: 0;
        text-transform: uppercase;
      }

      h1 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: 1.65rem;
        font-weight: 700;
        line-height: 1.16;
        margin: 0;
        max-width: 18rem;
      }
    `
  ]
})
export class AppComponent {}
