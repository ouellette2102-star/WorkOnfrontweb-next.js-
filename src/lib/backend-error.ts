export type NormalizedBackendError = {
  message: string;
  code?: string;
  status?: number;
  requestId?: string;
  details?: unknown;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(source: JsonRecord, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function numberValue(source: JsonRecord, key: string): number | undefined {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function withoutUndefined<T extends JsonRecord>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

export function normalizeBackendError(
  body: unknown,
  fallbackMessage: string,
  fallbackStatus?: number,
): NormalizedBackendError {
  const root = isRecord(body) ? body : {};
  const nested = isRecord(root.error) ? root.error : undefined;
  const source = nested ?? root;

  return withoutUndefined({
    message:
      stringValue(source, "message") ??
      stringValue(root, "message") ??
      fallbackMessage,
    code: stringValue(source, "code") ?? stringValue(root, "code"),
    status:
      numberValue(source, "status") ??
      numberValue(root, "status") ??
      fallbackStatus,
    requestId:
      stringValue(source, "requestId") ?? stringValue(root, "requestId"),
    details: source.details ?? root.details,
  });
}

export function buildBackendErrorBody(
  body: unknown,
  fallbackMessage: string,
  fallbackStatus?: number,
) {
  const error = normalizeBackendError(body, fallbackMessage, fallbackStatus);

  return withoutUndefined({
    message: error.message,
    code: error.code,
    status: error.status,
    requestId: error.requestId,
    details: error.details,
    error,
  });
}

