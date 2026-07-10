export async function readApiErrorMessage(
  response: Response,
  fallback: string,
  resolveMessageKey?: (messageKey: string) => string | null | undefined
): Promise<string> {
  try {
    const rawBody = await response.text();
    const trimmedBody = rawBody.trim();
    if (!trimmedBody) {
      return fallback;
    }

    try {
      const payload = JSON.parse(trimmedBody) as unknown;
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        const candidate = payload as { error?: unknown; message?: unknown; messageKey?: unknown };
        if (typeof candidate.messageKey === "string" && candidate.messageKey.trim()) {
          const translated = resolveMessageKey?.(candidate.messageKey.trim());
          if (translated && translated.trim()) {
            return translated.trim();
          }
        }
        if (typeof candidate.message === "string" && candidate.message.trim()) {
          return candidate.message.trim();
        }
        if (typeof candidate.error === "string" && candidate.error.trim()) {
          return candidate.error.trim();
        }
      }
    } catch {
      return trimmedBody;
    }

    return fallback;
  } catch {
    return fallback;
  }
}
