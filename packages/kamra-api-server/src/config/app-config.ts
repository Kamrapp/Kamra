const defaultMongoDnsServers = ["1.1.1.1", "8.8.8.8"] as const;

export interface AppConfig {
  mongodb: {
    configured: boolean;
    databaseName: string | null;
    dnsServers: string[] | null;
    uri: string | null;
  };
  nodeEnv: string;
}

export function readAppConfig(
  env: NodeJS.ProcessEnv = process.env
): AppConfig {
  const mongodbUri = env["MONGODB_URI"]?.trim() || null;
  const mongodbDatabaseName = env["MONGODB_DB_NAME"]?.trim() || null;
  const configuredMongoDnsServers = env["MONGODB_DNS_SERVERS"]
    ?.split(",")
    .map((server) => server.trim())
    .filter((server) => server.length > 0) ?? null;
  const mongodbDnsServers = configuredMongoDnsServers?.length
    ? configuredMongoDnsServers
    : mongodbUri
      ? [...defaultMongoDnsServers]
      : null;

  return {
    mongodb: {
      configured: Boolean(mongodbUri && mongodbDatabaseName),
      databaseName: mongodbDatabaseName,
      dnsServers: mongodbDnsServers,
      uri: mongodbUri
    },
    nodeEnv: env["NODE_ENV"] ?? "development"
  };
}
