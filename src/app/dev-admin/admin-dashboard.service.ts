import { inject, Injectable } from "@angular/core";

import { AuthService } from "../auth.service";
import { buildApiUrl } from "../api-url";
import { readApiErrorMessage } from "../shared/api-errors";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";

@Injectable({ providedIn: "root" })
export class AdminDashboardService {
  private readonly auth = inject(AuthService);
  private readonly loc = inject(LocalizationService);

  async request(input: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(buildApiUrl(input), {
        ...init,
        headers: {
          accept: "application/json",
          ...init.headers,
          ...this.auth.getAuthorizationHeaders()
        }
      });
    } catch {
      throw new Error(this.loc.t("health.browserHealthFailure"));
    }
  }

  async readPayload<T>(
    response: Response,
    fallbackMessage: string
  ): Promise<{ message: string; payload: T | null }> {
    const message = await readApiErrorMessage(response.clone(), fallbackMessage, (messageKey) =>
      this.loc.t(messageKey as TranslationKey)
    );

    try {
      return {
        message,
        payload: (await response.json()) as T
      };
    } catch {
      return {
        message,
        payload: null
      };
    }
  }
}
