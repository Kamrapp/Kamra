import { Component } from "@angular/core";

@Component({
  selector: "app-home",
  standalone: true,
  template: `
    <section class="home-board" aria-labelledby="home-title">
      <div class="pulse-card" aria-label="Pantry activity preview">
        <div class="pulse-orbit">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="pulse-list">
          <div class="pulse-row strong">
            <span>Milk</span>
            <span>low soon</span>
          </div>
          <div class="pulse-row">
            <span>Rice</span>
            <span>steady</span>
          </div>
          <div class="pulse-row">
            <span>Coffee</span>
            <span>watch</span>
          </div>
        </div>
      </div>

      <div class="home-copy">
        <p class="eyebrow">Today</p>
        <h1 id="home-title">Pantry pulse</h1>
        <p>
          A soft landing for household stock, shopping rhythm, and the little
          decisions that make the next grocery run feel less chaotic.
        </p>

        <dl class="mini-stats">
          <div>
            <dt>Notes</dt>
            <dd>3</dd>
          </div>
          <div>
            <dt>Lists</dt>
            <dd>1</dd>
          </div>
          <div>
            <dt>Sources</dt>
            <dd>0</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="placeholder-grid" aria-label="Kamra home preview">
      <article>
        <p class="card-kicker">Queue</p>
        <h2>Stocking Notes</h2>
        <p>Three pantry notes are waiting for a real product model to land.</p>
      </article>

      <article>
        <p class="card-kicker">Shape</p>
        <h2>Shopping Plan</h2>
        <p>Store choices, household limits, and list tradeoffs will live here.</p>
      </article>

      <article>
        <p class="card-kicker">Ops</p>
        <h2>Source Review</h2>
        <p>Ingestion status and operator review can join the drawer when ready.</p>
      </article>
    </section>
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: var(--space-7);
        min-height: 100%;
      }

      .home-board {
        align-items: stretch;
        display: grid;
        gap: var(--space-5);
        grid-template-columns: minmax(0, 1fr);
      }

      .pulse-card,
      .home-copy,
      article {
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
      }

      .pulse-card {
        background:
          linear-gradient(145deg, rgb(248 244 241 / 90%), rgb(255 255 255 / 62%)),
          color-mix(in srgb, var(--color-accent-sky) 18%, var(--color-surface));
        display: grid;
        gap: var(--space-5);
        min-height: 20rem;
        overflow: hidden;
        padding: clamp(1rem, 3vw, 1.5rem);
        position: relative;
      }

      .pulse-card::before {
        animation: scan 2400ms ease-in-out infinite;
        background: linear-gradient(
          90deg,
          transparent,
          rgb(255 255 255 / 46%),
          transparent
        );
        content: "";
        height: 100%;
        left: -60%;
        position: absolute;
        top: 0;
        transform: skewX(-12deg);
        width: 42%;
      }

      .pulse-orbit {
        align-items: center;
        align-self: center;
        display: grid;
        justify-self: center;
        min-height: 10rem;
        place-items: center;
        position: relative;
        width: min(100%, 18rem);
      }

      .pulse-orbit span {
        border: 1px solid color-mix(in srgb, var(--color-accent-leaf) 36%, transparent);
        border-radius: var(--radius-pill);
        box-shadow: 0 1rem 2rem rgb(111 159 33 / 12%);
        position: absolute;
      }

      .pulse-orbit span:nth-child(1) {
        animation: breathe 2200ms ease-in-out infinite;
        background: color-mix(in srgb, var(--color-accent-leaf) 30%, white 70%);
        height: 4.8rem;
        width: 4.8rem;
      }

      .pulse-orbit span:nth-child(2) {
        animation: breathe 2200ms ease-in-out 240ms infinite;
        height: 7.4rem;
        width: 7.4rem;
      }

      .pulse-orbit span:nth-child(3) {
        animation: breathe 2200ms ease-in-out 480ms infinite;
        height: 10rem;
        width: 10rem;
      }

      .pulse-list {
        display: grid;
        gap: var(--space-2);
      }

      .pulse-row {
        align-items: center;
        background: rgb(255 255 255 / 56%);
        border: 1px solid rgb(255 255 255 / 72%);
        border-radius: var(--radius-ui);
        color: var(--color-text-muted);
        display: flex;
        justify-content: space-between;
        min-height: 3rem;
        padding: 0.7rem 0.9rem;
      }

      .pulse-row.strong {
        color: var(--color-text);
        font-weight: 700;
      }

      .home-copy {
        align-content: center;
        display: grid;
        gap: var(--space-4);
        padding: clamp(1.1rem, 3vw, 1.75rem);
      }

      .eyebrow,
      .card-kicker {
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0;
        margin: 0;
        text-transform: uppercase;
      }

      h1,
      h2,
      p,
      dl,
      dd {
        margin: 0;
      }

      h1 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: clamp(2rem, 5vw, 3.2rem);
        line-height: 1.04;
      }

      .home-copy > p {
        color: var(--color-text-muted);
        line-height: 1.65;
        max-width: 35rem;
      }

      .mini-stats {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .mini-stats div {
        background: var(--surface-soft-background);
        border-radius: var(--radius-ui);
        display: grid;
        gap: 0.2rem;
        min-height: 4.6rem;
        padding: 0.8rem;
      }

      dt {
        color: var(--color-text-muted);
        font-size: 0.74rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      dd {
        color: var(--color-text);
        font-size: 1.4rem;
        font-weight: 700;
      }

      .placeholder-grid {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      article {
        display: grid;
        gap: var(--space-2);
        min-height: 10rem;
        padding: clamp(1rem, 2vw, 1.25rem);
      }

      h2 {
        color: var(--color-text);
        font-size: 1.08rem;
        line-height: 1.2;
      }

      article p:last-child {
        color: var(--color-text-muted);
        line-height: 1.55;
      }

      @keyframes breathe {
        0%,
        100% {
          opacity: 0.55;
          transform: scale(0.94);
        }

        50% {
          opacity: 1;
          transform: scale(1.03);
        }
      }

      @keyframes scan {
        0% {
          left: -60%;
        }

        55%,
        100% {
          left: 118%;
        }
      }

      @media (min-width: 900px) {
        .home-board {
          grid-template-columns: minmax(20rem, 0.85fr) minmax(0, 1.15fr);
        }
      }

      @media (max-width: 740px) {
        .mini-stats,
        .placeholder-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class HomeComponent {}
