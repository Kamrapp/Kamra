import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

import { LocalizationService } from "../shared/localization.service";

@Component({
  selector: "app-about-page",
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="about-page" aria-labelledby="about-title">
      <article class="about-hero">
        <div class="hero-copy">
          <p class="hero-kicker">{{ loc.t("about.kicker") }}</p>
          <h1 id="about-title">{{ loc.t("about.title") }}</h1>
          <p class="hero-summary">{{ loc.t("about.summary") }}</p>

          <div class="hero-actions">
            <a class="ui-button ui-button-primary ui-button-sm" routerLink="/">
              {{ loc.t("about.backHome") }}
            </a>
            <a
              class="ui-button ui-button-quiet ui-button-sm"
              href="https://kamrapp.hu"
              target="_blank"
              rel="noreferrer"
            >
              {{ loc.t("about.openPrimaryUrl") }}
            </a>
          </div>
        </div>

        <div class="hero-mark-card">
          <img
            class="hero-mark"
            src="/brand/kamra-basket.png"
            [attr.alt]="loc.t('about.imageAlt')"
            width="240"
            height="240"
          />
          <p class="hero-note">{{ loc.t("about.heroNote") }}</p>
        </div>
      </article>

      <div class="about-grid">
        <article class="about-card promise-card">
          <p class="card-kicker">{{ loc.t("about.promiseKicker") }}</p>
          <h2>{{ loc.t("about.promiseTitle") }}</h2>
          <p>{{ loc.t("about.promiseBodyOne") }}</p>
          <p>{{ loc.t("about.promiseBodyTwo") }}</p>
        </article>

        <article class="about-card story-card">
          <p class="card-kicker">{{ loc.t("about.storyKicker") }}</p>
          <h2>{{ loc.t("about.storyTitle") }}</h2>
          <p>{{ loc.t("about.storyBody") }}</p>
        </article>

        <article class="about-card tech-card">
          <p class="card-kicker">{{ loc.t("about.techKicker") }}</p>
          <h2>{{ loc.t("about.techTitle") }}</h2>
          <p>{{ loc.t("about.techBodyOne") }}</p>
          <p>{{ loc.t("about.techBodyTwo") }}</p>
          <p class="supporting-link">
            <a
              href="https://github.com/Kamrapp/Kamra"
              target="_blank"
              rel="noreferrer"
            >
              github.com/Kamrapp/Kamra
            </a>
          </p>
        </article>

        <article class="about-card access-card">
          <p class="card-kicker">{{ loc.t("about.accessKicker") }}</p>
          <h2>{{ loc.t("about.accessTitle") }}</h2>
          <p>{{ loc.t("about.accessBody") }}</p>
          <div class="access-links">
            <a href="https://kamrapp.hu" target="_blank" rel="noreferrer">kamrapp.hu</a>
            <a href="https://api-kamrapp.vercel.com" target="_blank" rel="noreferrer">api-kamrapp.vercel.com</a>
            <a href="https://project-qn32z.vercel.app/" target="_blank" rel="noreferrer">project-qn32z.vercel.app</a>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }

      .about-page {
        display: grid;
        gap: var(--space-4);
        min-height: 100%;
      }

      .about-hero,
      .about-card {
        backdrop-filter: blur(14px);
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
      }

      .about-hero {
        align-items: stretch;
        background:
          radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent-sky) 22%, transparent) 0, transparent 44%),
          linear-gradient(145deg, color-mix(in srgb, var(--color-accent-leaf) 10%, var(--surface-shell-background)) 0%, var(--surface-shell-background) 54%, color-mix(in srgb, var(--color-accent-sand) 18%, var(--surface-shell-background)) 100%);
        display: grid;
        gap: var(--space-4);
        overflow: hidden;
        padding: clamp(1.15rem, 3vw, 1.8rem);
        position: relative;
      }

      .about-hero::after {
        background: linear-gradient(90deg, transparent, color-mix(in srgb, white 22%, transparent), transparent);
        content: "";
        inset: 0 auto 0 -28%;
        position: absolute;
        transform: skewX(-18deg);
        width: 32%;
      }

      .hero-copy,
      .hero-mark-card,
      .about-card {
        position: relative;
        z-index: 1;
      }

      .hero-copy {
        display: grid;
        gap: var(--space-3);
      }

      .hero-kicker,
      .card-kicker,
      .hero-note {
        margin: 0;
      }

      .hero-kicker,
      .card-kicker {
        color: var(--color-text-muted);
        font-size: 0.74rem;
        font-weight: 900;
        letter-spacing: 0.03em;
        text-transform: uppercase;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1,
      h2 {
        color: var(--color-text);
        font-family: var(--font-display);
        line-height: 1.03;
      }

      h1 {
        font-size: clamp(2.2rem, 5vw, 3.6rem);
        max-width: 13ch;
      }

      h2 {
        font-size: clamp(1.2rem, 3vw, 1.6rem);
      }

      p {
        color: var(--color-text);
        line-height: 1.6;
      }

      .hero-summary {
        font-size: 1rem;
        max-width: 66ch;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
      }

      .hero-mark-card {
        align-content: center;
        background: color-mix(in srgb, var(--color-card-tint) 78%, white 22%);
        border: 1px solid color-mix(in srgb, var(--line-panel) 72%, white 28%);
        border-radius: calc(var(--radius-ui) - 0.2rem);
        display: grid;
        gap: var(--space-3);
        justify-items: center;
        min-height: 100%;
        padding: 1.2rem;
      }

      .hero-mark {
        aspect-ratio: 1;
        filter: drop-shadow(0 1rem 2rem rgb(45 34 28 / 18%));
        height: auto;
        max-width: min(100%, 14rem);
        width: 100%;
      }

      .hero-note {
        color: var(--color-text-muted);
        font-size: 0.86rem;
        font-weight: 700;
        text-align: center;
      }

      .about-grid {
        display: grid;
        gap: var(--space-4);
      }

      .about-card {
        align-content: start;
        display: grid;
        gap: var(--space-3);
        padding: clamp(1rem, 2.5vw, 1.35rem);
      }

      .promise-card {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--color-accent-leaf) 10%, var(--surface-shell-background)) 0%, var(--surface-shell-background) 100%);
      }

      .story-card {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--color-accent-sand) 16%, var(--surface-shell-background)) 0%, var(--surface-shell-background) 100%);
      }

      .tech-card {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--color-accent-sky) 14%, var(--surface-shell-background)) 0%, var(--surface-shell-background) 100%);
      }

      .access-card {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--color-wood-soft) 11%, var(--surface-shell-background)) 0%, var(--surface-shell-background) 100%);
      }

      .access-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      a {
        color: var(--color-link, var(--color-text));
      }

      .supporting-link a,
      .access-links a {
        font-weight: 700;
        text-decoration-thickness: 0.08em;
      }

      @media (min-width: 960px) {
        .about-page {
          align-content: start;
          grid-template-rows: auto 1fr;
        }

        .about-hero {
          grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.8fr);
          min-height: min(23rem, 100%);
        }

        .about-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 720px) {
        .hero-actions {
          display: grid;
        }
      }
    `
  ]
})
export class AboutPageComponent {
  readonly loc = inject(LocalizationService);
}
