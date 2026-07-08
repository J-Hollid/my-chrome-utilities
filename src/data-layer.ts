export type HistoryPathStatus = "ready" | "path missing" | "not an array";

export const HISTORY_PATH_STORAGE_KEY = "historyArrayPath";
export const DEFAULT_HISTORY_PATH = "queue.history";

export function normalizeHistoryArrayPath(path: string): string {
  return path
    .split(".")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(".");
}

export function resolvePath(pageObject: unknown, path: string): unknown {
  const parts = normalizeHistoryArrayPath(path).split(".");

  if (parts.length === 0 || parts[0] === "") {
    return undefined;
  }

  let current: unknown = pageObject;

  for (const part of parts) {
    if (current === null || typeof current !== "object" || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function pathStatus(pageObject: unknown, path: string): HistoryPathStatus {
  const value = resolvePath(pageObject, path);

  if (value === undefined) {
    return "path missing";
  }

  return Array.isArray(value) ? "ready" : "not an array";
}

export function getHistoryArrayPath(): string {
  return localStorage.getItem(HISTORY_PATH_STORAGE_KEY) ?? DEFAULT_HISTORY_PATH;
}

export function setHistoryArrayPath(path: string): string {
  const normalizedPath = normalizeHistoryArrayPath(path);
  localStorage.setItem(HISTORY_PATH_STORAGE_KEY, normalizedPath);
  return normalizedPath;
}

export function samplePageObject(): unknown {
  return {
    queue: {
      history: [],
      value: 1,
    },
    test: {
      test: [],
    },
    some: {
      deep: {
        object: {
          history: [],
        },
      },
    },
  };
}
