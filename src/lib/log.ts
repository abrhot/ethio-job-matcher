type Field = string | number | boolean | null;

const SENSITIVE = /token|secret|password|authorization|cookie|cv|raw|hash|session/i;

function scrub(fields?: Record<string, Field>): Record<string, Field> {
  if (!fields) return {};
  const safe: Record<string, Field> = {};
  for (const [key, value] of Object.entries(fields)) {
    safe[key] = SENSITIVE.test(key) ? "[redacted]" : value;
  }
  return safe;
}

function write(
  level: "info" | "error",
  scope: string,
  message: string,
  extra: Record<string, Field>,
) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...extra,
  });
  if (level === "error") console.error(line);
  else console.log(line);
}

export function logInfo(scope: string, message: string, fields?: Record<string, Field>) {
  write("info", scope, message, scrub(fields));
}

export function logError(
  scope: string,
  message: string,
  error?: unknown,
  fields?: Record<string, Field>,
) {
  const detail = error instanceof Error ? error.message : null;
  write("error", scope, message, { ...scrub(fields), detail });
}
