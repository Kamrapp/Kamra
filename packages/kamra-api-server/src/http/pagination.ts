export const defaultApiPageSize = 50;
export const maxApiPageSize = 100;

export interface ApiPageRequest {
  offset: number;
  page: number;
  pageSize: number;
}

export interface ApiPageResult<T> {
  hasNextPage: boolean;
  items: T[];
  page: number;
  pageSize: number;
}

export function readApiPageRequest(
  query: Record<string, string | string[] | undefined> | undefined
): ApiPageRequest {
  const page = Math.max(1, readPositiveInteger(query?.["page"], 1));
  const pageSize = Math.min(
    maxApiPageSize,
    Math.max(1, readPositiveInteger(query?.["pageSize"], defaultApiPageSize))
  );
  return { offset: (page - 1) * pageSize, page, pageSize };
}

export function pageResponse<T>(
  request: ApiPageRequest,
  result: { hasNextPage: boolean; items: T[] }
): ApiPageResult<T> {
  return {
    hasNextPage: result.hasNextPage,
    items: result.items,
    page: request.page,
    pageSize: request.pageSize
  };
}

function readPositiveInteger(value: string | string[] | undefined, fallback: number): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = candidate ? Number(candidate) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
