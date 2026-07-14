const defaultMongoDnsServers = ["1.1.1.1", "8.8.8.8"] as const;
const defaultCorsAllowedHeaders = ["Accept", "Authorization", "Content-Type"] as const;
const defaultCorsAllowedMethods = ["DELETE", "GET", "OPTIONS", "PATCH", "POST"] as const;

export interface CorsConfig {
  allowedHeaders: string[];
  allowedMethods: string[];
  allowedOriginPatterns: string[];
  allowedOrigins: string[];
}

export interface AppConfig {
  auth: {
    tokenMaxAgeSeconds: number;
    tokenSecret: string | null;
    tokenSecretConfigured: boolean;
  };
  cors: CorsConfig;
  mongodb: {
    configured: boolean;
    databaseName: string | null;
    dnsServers: string[] | null;
    uri: string | null;
  };
  nodeEnv: string;
}

export function readAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const authTokenSecret = env["AUTH_TOKEN_SECRET"]?.trim() || null;
  const corsAllowedOrigins = readConfiguredOrigins(env["CORS_ALLOWED_ORIGINS"]);
  const corsAllowedOriginPatterns = readConfiguredOriginPatterns(
    env["CORS_ALLOWED_ORIGIN_PATTERNS"]
  );
  const mongodbUri = env["MONGODB_URI"]?.trim() || null;
  const mongodbDatabaseName = env["MONGODB_DB_NAME"]?.trim() || null;
  const configuredMongoDnsServers =
    env["MONGODB_DNS_SERVERS"]
      ?.split(",")
      .map((server) => server.trim())
      .filter((server) => server.length > 0) ?? null;
  const mongodbDnsServers = configuredMongoDnsServers?.length
    ? configuredMongoDnsServers
    : mongodbUri
      ? [...defaultMongoDnsServers]
      : null;

  return {
    auth: {
      tokenMaxAgeSeconds: 60 * 60 * 8,
      tokenSecret: authTokenSecret,
      tokenSecretConfigured: Boolean(authTokenSecret)
    },
    cors: {
      allowedHeaders: [...defaultCorsAllowedHeaders],
      allowedMethods: [...defaultCorsAllowedMethods],
      allowedOriginPatterns: corsAllowedOriginPatterns,
      allowedOrigins: corsAllowedOrigins
    },
    mongodb: {
      configured: Boolean(mongodbUri && mongodbDatabaseName),
      databaseName: mongodbDatabaseName,
      dnsServers: mongodbDnsServers,
      uri: mongodbUri
    },
    nodeEnv: env["NODE_ENV"] ?? "development"
  };
}

export function findAllowedCorsOrigin(config: AppConfig, origin: string): string | null {
  const normalizedOrigin = normalizeConfiguredOrigin(origin);
  if (!normalizedOrigin) {
    return null;
  }

  if (config.cors.allowedOrigins.includes(normalizedOrigin)) {
    return normalizedOrigin;
  }

  return config.cors.allowedOriginPatterns.some((pattern) =>
    matchesOriginPattern(normalizedOrigin, pattern)
  )
    ? normalizedOrigin
    : null;
}

function readConfiguredOrigins(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((entry) => normalizeConfiguredOrigin(entry))
      .filter((entry): entry is string => entry !== null) ?? []
  );
}

function readConfiguredOriginPatterns(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((entry) => normalizeConfiguredOriginPattern(entry))
      .filter((entry): entry is string => entry !== null) ?? []
  );
}

function normalizeConfiguredOrigin(value: string | undefined): string | null {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return null;
  }

  try {
    const url = new URL(trimmedValue);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (url.username || url.password) {
      return null;
    }

    if ((url.pathname && url.pathname !== "/") || url.search || url.hash) {
      return null;
    }

    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function normalizeConfiguredOriginPattern(value: string | undefined): string | null {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return null;
  }

  const patternMatch = /^(https?):\/\/([^/?#]+)\/?$/.exec(trimmedValue);
  if (!patternMatch) {
    return null;
  }

  const protocol = patternMatch[1];
  const host = patternMatch[2];
  if (!host || host.includes("@")) {
    return null;
  }

  const [hostname, ...portSegments] = host.split(":");
  const port = portSegments.length > 0 ? portSegments.join(":") : null;
  if (!hostname || !isValidPatternHostname(hostname)) {
    return null;
  }

  if (port && (!/^\d+$/.test(port) || host.includes("*:"))) {
    return null;
  }

  return `${protocol}://${hostname}${port ? `:${port}` : ""}`;
}

function isValidPatternHostname(hostname: string): boolean {
  if (hostname.startsWith(".") || hostname.endsWith(".")) {
    return false;
  }

  return hostname
    .split(".")
    .every((segment) => segment.length > 0 && /^[a-z0-9*-]+$/i.test(segment));
}

function matchesOriginPattern(origin: string, pattern: string): boolean {
  const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const wildcardPattern = escapedPattern.replace(/\*/g, "[^.]+");
  const regex = new RegExp(`^${wildcardPattern}$`, "i");

  return regex.test(origin);
}
