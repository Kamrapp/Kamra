# Logging

Kamra currently uses a simple split logging model:

- server-side logs go to the console and, locally, to daily rolling files under `logs/`
- browser-side logs go to the browser console and are forwarded to `POST /api/log`
- forwarded browser logs are mirrored to the server console and, locally, written to the same rolling file set
- on Vercel, both `/api/health` and `/api/log` are deployed as thin Function entrypoints that delegate to the shared server handler
- file logging is disabled on Vercel; hosted logs are console-only

## Server Logging

The shared server logger writes timestamped records to:

- console output for local runs and Vercel runtime logs
- JSONL files under `logs/server-YYYY-MM-DD.log` during local runs

The file logs roll daily and older log files are removed after 10 days.

## Browser Logging

The browser bootstrap and feature pages use the root-provided `BrowserLoggerService` from `src/app/browser-logger.service.ts`. The underlying helper in `src/app/browser-logger.ts` remains the compatibility and transport implementation.

The injected facade and helper together:

- logs to the browser console with timestamps
- sends structured log payloads to `POST /api/log`
- never blocks the app if the log endpoint is unavailable
- add bounded `environment: "browser"` context to injected feature events

Frontend logging conventions:

- inject `BrowserLoggerService`; do not call `console.*` or construct `/api/log` requests from feature code
- use stable, human-readable event names such as `Product catalog loaded` and `Health check response received`
- include only small operational context such as route, status, counts, and identifiers safe for diagnostics
- never include access tokens, passwords, full credentials, or unrestricted form payloads
- wrap thrown values under a named field such as `error` rather than replacing the structured event with an unbounded value
- log expected user-facing failures at `error` only when the event helps diagnose the failure; avoid logging the same failure repeatedly from nested layers
- treat browser forwarding failure as non-fatal and do not await it from user actions

The server mirrors those browser logs to the server console. During local runs, it also records them to `logs/browser-YYYY-MM-DD.log`.

## Notes

- Vercel runtime logs already capture server `console.*` output, so the console path is the primary hosted observability surface.
- The Vercel dashboard separates request logs from runtime logs; application log lines appear in runtime/function logs rather than in the raw request list.
- Browser log forwarding only reaches Vercel runtime logs when the deployed project includes the `/api/log` Function route.
- Health failures are logged in every environment so hosted MongoDB connection issues can be diagnosed from Vercel runtime logs.
- The file logs are a local and developer convenience, not the source of truth for hosted retention.
- `LOG_FILE_DIR` controls the local file output path when file logging is enabled. Hosted Vercel runs ignore it and stay console-only.
- Logging payloads should stay small and should not include secrets.
