import { publicAppConfig } from "./generated-public-config";

function normalizeApiBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.trim().replace(/\/+$/, "");
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;
  const apiBaseUrl = normalizeApiBaseUrl(publicAppConfig.apiBaseUrl);

  return apiBaseUrl
    ? `${apiBaseUrl}${normalizedPath}`
    : normalizedPath;
}
