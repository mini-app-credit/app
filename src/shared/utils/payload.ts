export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getNonEmptyTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function getStringField(payload: Record<string, unknown>, key: string): string | null {
  return getNonEmptyTrimmedString(payload[key]);
}

export function getObjectField(payload: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = payload[key];
  if (!isRecord(value)) {
    return null;
  }

  return value;
}
