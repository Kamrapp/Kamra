# Crawler Policy

## Purpose

Kamra uses crawlers and fetchers to collect grocery product and price information for household planning, price history, and product discovery.

This policy is an engineering and operations guardrail, not legal advice. It exists to reduce risk, respect source systems, and make crawler behavior reviewable before any source is enabled.

## Source Principles

- Crawl only public product, price, offer, and availability data needed for Kamra features.
- Prefer official feeds, public APIs, sitemaps, or lightweight static pages when available.
- Respect robots.txt and source-specific terms before enabling a crawler.
- Identify crawler traffic with a clear user agent when technically possible.
- Rate-limit crawlers conservatively and avoid traffic patterns that could burden a source.
- Do not bypass authentication, paywalls, CAPTCHA, geographic restrictions, or anti-bot controls.
- Do not collect personal data from shoppers, employees, reviews, accounts, or tracking surfaces.
- Do not scrape private or user-specific prices from authenticated customer accounts.
- Disable or remove a source promptly if a store objects or if terms become unclear.

## Review Checklist

Before adding or enabling a crawler source, the plan should record:

- source URL and data purpose
- whether robots.txt allows the intended paths
- known source terms or restrictions
- expected request volume and schedule
- user agent or identification strategy
- data retained in raw snapshots
- fields promoted into canonical products or price observations
- failure mode when pages change or access is denied
- rollback switch or feature flag

## Runtime Guardrails

- Crawler jobs run outside user-facing request handlers.
- Jobs must be manually dispatchable and easy to disable.
- Schedules should fit free-tier limits and source friendliness.
- Raw snapshots should preserve source truth without storing unnecessary page noise.
- Transformation should be deterministic and traceable back to source snapshots.
- Source-specific adapters should be isolated so one brittle source does not compromise the pipeline.
- Repeated access failures, blocking signals, or unexpected redirects should fail closed and alert the admin instead of escalating traffic.

## Public Demo Guardrails

- Public demos must not imply store endorsement, sponsorship, or partnership.
- Store names, logos, and trademarks should be used only where necessary for factual source identification.
- Price data should be presented as observed and timestamped, not guaranteed.
- User-facing copy should avoid claims that Kamra is official, exhaustive, or always current.
- The project must remain advertisement-free and independent from seller agenda unless the owner explicitly revises the concept.

## Complaints And Takedown

If a source owner objects:

1. Disable the affected crawler or schedule.
2. Preserve logs needed to understand what happened.
3. Stop publishing affected fresh data while the concern is reviewed.
4. Document the decision in a session note or learning file.
5. Resume only after the source policy is clear and the user approves.
