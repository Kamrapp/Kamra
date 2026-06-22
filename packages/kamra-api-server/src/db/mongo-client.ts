import { setServers } from "node:dns";

import { MongoClient } from "mongodb";
import { writeServerLog } from "../logging/kamra-logger.js";

let cachedClient: MongoClient | null = null;
let cachedUri: string | null = null;

export async function getMongoClient(
  uri: string,
  dnsServers: string[] | null = null
): Promise<MongoClient> {
  if (cachedClient && cachedUri === uri) {
    return cachedClient;
  }

  if (dnsServers?.length) {
    setServers(dnsServers);
  }

  writeServerLog("info", "Connecting to data store", {
    dnsServers: dnsServers?.length ? dnsServers : undefined,
    uriHost: new URL(uri).hostname
  });

  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });
  await client.connect();

  cachedClient = client;
  cachedUri = uri;

  writeServerLog("info", "Data store connected", {
    databaseName: client.db().databaseName,
    host: client.options.hosts?.map((host) => `${host.host}:${host.port ?? 27017}`),
    tls: client.options.tls
  });

  return client;
}
