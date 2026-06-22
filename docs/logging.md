# Logging

Kamra currently uses a simple split logging model:

- server-side logs go to the console and to daily rolling files under `logs/`
- browser-side logs go to the browser console and are forwarded to `POST /api/log`
- forwarded browser logs are written by the server to the same rolling file set and mirrored to the server console
- on Vercel, both `/api/health` and `/api/log` are deployed as thin Function entrypoints that delegate to the shared server handler

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
- The Vercel dashboard separates request logs from runtime logs; application log lines appear in runtime/function logs rather than in the raw request list.
- Browser log forwarding only reaches Vercel runtime logs when the deployed project includes the `/api/log` Function route.
- Health failures are logged in every environment so hosted MongoDB connection issues can be diagnosed from Vercel runtime logs.
- The file logs are a local and developer convenience, not the source of truth for hosted retention.
- Logging payloads should stay small and should not include secrets.
