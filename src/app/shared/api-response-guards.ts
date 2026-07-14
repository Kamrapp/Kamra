export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord);
}

export function hasRecordProperty(value: unknown, key: string): boolean {
  return isRecord(value) && isRecord(value[key]);
}

export function hasRecordArrayProperty(value: unknown, key: string): boolean {
  return isRecord(value) && isRecordArray(value[key]);
}
