export function trimTrailingWhitespace(value: string): string {
  return value.replace(/\s+$/u, "");
}

export function trimTrailingWhitespaceDeep<T>(data: T): T {
  if (typeof data === "string") return trimTrailingWhitespace(data) as T;
  if (Array.isArray(data)) return data.map(trimTrailingWhitespaceDeep) as T;
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        key,
        trimTrailingWhitespaceDeep(value),
      ]),
    ) as T;
  }
  return data;
}
