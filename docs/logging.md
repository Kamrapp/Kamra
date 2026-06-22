# Logging

Kamra currently uses a simple split logging model:

- server-side logs go to the console and to daily rolling files under `logs/`
- browser-side logs go to the browser console and are forwarded to `POST /api/log`
- forwarded browser logs are written by the server to the same rolling file set and mirrored to the server console

## Server Logging

The shared server logger writes timestamped records in two places:

- console output for local runs and Vercel runtime logs
- JSONL files under `logs/server-YYYY-MM-DD.log`

The file logs roll daily and older log files are removed after 10 days.

## Browser Logging

The browser bootstrap writes a few startup records through `src/app/browser-logger.ts`.

That helper:

- logs to the browser console with timestamps
- sends structured log payloads to `POST /api/log`
- never blocks the app if the log endpoint is unavailable

The server then records those browser logs to `logs/browser-YYYY-MM-DD.log` and mirrors them to the server console.

## Notes

- Vercel runtime logs already capture server `console.*` output, so the console path is the primary hosted observability surface.
- The file logs are a local and developer convenience, not the source of truth for hosted retention.
- Logging payloads should stay small and should not include secrets.
