export async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const rawBody = await response.text();
    const trimmedBody = rawBody.trim();
    if (!trimmedBody) {
      return fallback;
    }

    try {
      const payload = JSON.parse(trimmedBody) as unknown;
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        const candidate = payload as { error?: unknown; message?: unknown };
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
