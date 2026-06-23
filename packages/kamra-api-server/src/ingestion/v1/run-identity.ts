import type { CrawlRunIdentity } from "./contracts.js";

export function toCrawlDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function createCrawlRunIdentity(
  sourceName: string,
  workflowName: string,
  now = new Date()
): CrawlRunIdentity {
  const crawlDate = toCrawlDate(now);

  return {
    crawlDate,
    crawlRunId: `${workflowName}:${sourceName}:${crawlDate}`,
    sourceName,
    workflowName
  };
}
